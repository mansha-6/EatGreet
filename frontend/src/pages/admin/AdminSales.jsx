import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import {
    Calendar, DollarSign, TrendingUp, Download, Eye, X, Printer,
    FileText, Search, Filter, ChevronDown, Wallet, ShoppingBag, PieChart, Activity, UtensilsCrossed,
    ChevronLeft, ChevronRight, RotateCcw, FileSpreadsheet
} from 'lucide-react';
import { orderAPI, restaurantAPI, statsAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import EatGreetLogo from '../../assets/logo-full.png';

// Helper to format currency
const formatCurrency = (amount, symbol = '$') => {
    if (amount === undefined || amount === null) return `${symbol}0.00`;
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SalesCard = ({ title, value, subValue, icon: Icon, isCurrency, mobileTitle }) => {
    return (
        <div className="bg-white rounded-[1.2rem] sm:rounded-[2rem] px-3 sm:px-6 py-2 sm:py-4 flex items-center h-[82px] sm:h-[140px] shadow-sm relative border border-transparent hover:border-gray-100 transition-all">
            <div className="flex items-center gap-2 sm:gap-4 w-full">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#F3F3F3] rounded-full flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 sm:w-6 sm:h-6 opacity-60 text-black" />
                </div>
                <div className="flex flex-col min-w-0">
                    <h3 className="text-[16px] sm:text-[28px] lg:text-[32px] font-normal text-black leading-none flex items-baseline tracking-tight">
                        {value}
                    </h3>
                    <p className="text-[10px] sm:text-[13px] lg:text-[14px] text-gray-400 mt-1 sm:mt-2 font-normal tracking-tight truncate w-full">
                        <span className="inline sm:hidden">{mobileTitle || title}</span>
                        <span className="hidden sm:inline">{title}</span>
                        {subValue && <span className="opacity-60 ml-1 font-normal hidden sm:inline">- {subValue}</span>}
                    </p>
                </div>
            </div>
        </div>
    );
};

const DynamicEbitdaCard = ({ stats, currencySymbol }) => {
    const [period, setPeriod] = useState('Monthly'); // Default
    const [isOpen, setIsOpen] = useState(false);

    const getData = () => {
        switch (period) {
            case 'Weekly': return stats.weekly.ebitda;
            case 'Quarterly': return stats.quarterly.ebitda;
            case 'Annual': return stats.annual.ebitda;
            case 'Monthly':
            default: return stats.monthly.ebitda;
        }
    };

    return (
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-transparent hover:border-gray-100 transition-all relative">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#FD6941] bg-[#FD6941]">
                    <Wallet className="w-6 h-6" />
                </div>

                {/* Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-1 text-xs font-normal bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg text-gray-500 transition-colors"
                    >
                        {period} <ChevronDown className="w-3 h-3" />
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 overflow-hidden">
                                {['Weekly', 'Monthly', 'Quarterly', 'Annual'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => { setPeriod(p); setIsOpen(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs font-normal hover:bg-gray-50 ${period === p ? 'text-black bg-gray-50' : 'text-gray-500'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div>
                <p className="text-gray-400 text-sm font-normal mb-1">EBITDA ({period})</p>
                <h3 className="text-2xl font-normal text-black">{formatCurrency(getData(), currencySymbol)}</h3>
                <p className="text-xs text-gray-400 mt-1">Net Earnings (~35%)</p>
            </div>
        </div>
    );
};

// Invoice Modal Component
// Custom Date Range Picker Component
// Custom Date Range Picker Component
const DateRangePicker = ({ range, onChange, onClose }) => {
    // Helper: Parse "YYYY-MM-DD" string to Local Date Object (Midnight)
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    // Helper: Format Date Object to "YYYY-MM-DD" local string
    const toLocalDateString = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [viewDate, setViewDate] = useState(() => {
        return range.start ? parseLocalDate(range.start) : new Date();
    });

    const [selection, setSelection] = useState({
        start: range.start ? parseLocalDate(range.start) : null,
        end: range.end ? parseLocalDate(range.end) : null
    });

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handleDateClick = (day) => {
        // Create date at 00:00:00 Local Time
        const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

        // Reset check: if we already have both, or no start, start over
        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: clickedDate, end: null });
        } else {
            // We have start, but no end
            if (clickedDate.getTime() >= selection.start.getTime()) {
                // If clicking the same date or future date, set as end
                setSelection({ ...selection, end: clickedDate });
            } else {
                // If clicking before start, reset as new start
                setSelection({ start: clickedDate, end: null });
            }
        }
    };

    const applySelection = () => {
        if (selection.start) {
            onChange({
                start: toLocalDateString(selection.start),
                end: toLocalDateString(selection.end || selection.start)
            });
        }
        onClose();
    };

    const clearSelection = () => {
        setSelection({ start: null, end: null });
        onChange({ start: '', end: '' });
        onClose();
    };

    const setPreset = (type) => {
        const now = new Date();
        // Set time to midnight for consistency
        now.setHours(0, 0, 0, 0);
        let start, end = new Date(now);

        switch (type) {
            case 'today':
                start = new Date(now);
                break;
            case 'yesterday':
                start = new Date(now);
                start.setDate(now.getDate() - 1);
                end = new Date(start);
                break;
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                start = null;
        }

        if (start) {
            onChange({
                start: toLocalDateString(start),
                end: toLocalDateString(end)
            });
            onClose();
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const isSelected = (day) => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (!selection.start) return false;

        const t = d.getTime();
        if (t === selection.start.getTime()) return true;
        if (selection.end && t === selection.end.getTime()) return true;
        return false;
    };

    const isInRange = (day) => {
        if (!selection.start || !selection.end) return false;
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return d > selection.start && d < selection.end;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-[420px] rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-normal text-black">Select Date Range</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'yesterday', label: 'Yesterday' },
                        { id: 'week', label: 'Last 7 Days' },
                        { id: 'month', label: 'This Month' }
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPreset(p.id)}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full text-xs font-normal transition-all"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-normal text-lg text-black">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={`${d}-${i}`} className="h-10 flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth(viewDate) }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
                        const day = i + 1;
                        const active = isSelected(day);
                        const range = isInRange(day);

                        let stateClasses = "";
                        if (active) {
                            stateClasses = "bg-[#FD6941] text-white shadow-lg z-10 hover:bg-[#E55A35]";
                        } else if (range) {
                            stateClasses = "bg-[#FFF5F1] text-[#FD6941] hover:bg-[#FFE4DE]";
                        } else {
                            stateClasses = "text-gray-700 hover:bg-gray-100";
                        }

                        return (
                            <button
                                key={day}
                                onClick={() => handleDateClick(day)}
                                className={`h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center text-sm rounded-full transition-all relative ${stateClasses}`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={clearSelection}
                        className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl text-sm sm:text-base font-normal transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                        Clear
                    </button>
                    <button
                        onClick={applySelection}
                        className="flex-[2] py-4 bg-[#FD6941] hover:bg-[#FD6941]/90 text-white rounded-2xl text-sm sm:text-base font-normal transition-all shadow-lg "
                    >
                        Apply Range
                    </button>
                </div>
            </div>
        </div>
    );
};

const InvoiceModal = ({ order, isOpen, onClose, currencySymbol, restaurant }) => {
    if (!isOpen || !order) return null;

    // Calculate order stats
    const orderStats = useMemo(() => {
        if (!order) return null;
        const subtotal = order.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0;
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const totalRaw = subtotal + cgst + sgst;
        const grandTotal = Math.round(totalRaw);
        const roundOff = grandTotal - totalRaw;

        return {
            subtotal,
            cgst,
            sgst,
            totalRaw,
            grandTotal,
            roundOff
        };
    }, [order]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const itemsRows = (order.items || []).map((it, i) => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                <div style="flex: 1;">${i + 1}.${it.name}</div>
                <div style="width: 30px; text-align: center;">${it.quantity || 1}</div>
                <div style="width: 60px; text-align: right;">${(it.price || 0).toFixed(2)}</div>
                <div style="width: 70px; text-align: right;">${(it.price * (it.quantity || 1)).toFixed(2)}</div>
            </div>
        `).join('');

        const html = `
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Invoice</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
                    body { 
                        font-family: 'Courier Prime', monospace; 
                        color: #000; 
                        width: 300px; 
                        margin: 0 auto; 
                        padding: 20px;
                    }
                    .header { text-align: center; margin-bottom: 20px; }
                    .restaurant-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
                    .restaurant-info { font-size: 12px; margin-bottom: 2px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; }
                    .table-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 14px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${EatGreetLogo}" style="height: 25px; width: auto; margin: 0 auto 15px; display: block; opacity: 0.8;" />
                    ${restaurant?.logo ? `<img src="${restaurant.logo}" style="height: 50px; width: auto; margin-bottom: 10px;" />` : ''}
                    <div class="restaurant-name">${restaurant?.name || 'EatGreet Restaurant'}</div>
                    <div class="restaurant-info">${restaurant?.address || restaurant?.restaurantDetails?.address || 'Restaurant Address'}</div>
                    ${(restaurant?.contactNumber || restaurant?.restaurantDetails?.contactNumber) ? `<div class="restaurant-info">Tel: ${restaurant.contactNumber || restaurant.restaurantDetails.contactNumber}</div>` : ''}
                    <div class="restaurant-info">GST - 24AAYFT4562G1ZO</div>
                </div>

                <div class="divider"></div>
                <div class="info-row"><span>Name:</span> <span>${order.customerInfo?.name || 'Guest'}</span></div>
                ${order.customerInfo?.phone ? `<div class="info-row"><span>Tel:</span> <span>${order.customerInfo.phone}</span></div>` : ''}
                <div class="divider"></div>

                <div class="info-row">
                    <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>Dine In: ${order.tableNumber || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="info-row">
                    <span>Cashier: Admin</span>
                    <span>Bill No: ${order.dailySequence ? String(order.dailySequence).padStart(3, '0') : order._id.slice(-4)}</span>
                </div>
                <div class="info-row">
                    <span>Payment:</span>
                    <span>${order.paymentMethod || 'Cash'}</span>
                </div>

                <div class="divider"></div>
                <div class="table-header">
                    <div style="flex: 1;">No.Item</div>
                    <div style="width: 30px; text-align: center;">Qty</div>
                    <div style="width: 60px; text-align: right;">Price</div>
                    <div style="width: 70px; text-align: right;">Amt</div>
                </div>
                <div class="divider"></div>

                ${itemsRows}

                <div class="divider"></div>
                <div class="info-row" style="font-weight: bold;">
                    <span>Total Qty: ${order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}</span>
                    <span>Sub Total: ${currencySymbol}${orderStats.subtotal.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span>CGST@2.5%</span>
                    <span>${currencySymbol}${orderStats.cgst.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span>SGST@2.5%</span>
                    <span>${currencySymbol}${orderStats.sgst.toFixed(2)}</span>
                </div>
                <div class="info-row">
                     <span>Total</span>
                     <span>${currencySymbol}${orderStats.totalRaw.toFixed(2)}</span>
                </div>
                 <div class="info-row">
                     <span>Round Off</span>
                     <span>${currencySymbol}${orderStats.roundOff.toFixed(2)}</span>
                </div>
                <div class="divider"></div>
                <div class="info-row" style="font-size: 16px; font-weight: bold;">
                    <span>Grand Total</span>
                    <span>${currencySymbol}${orderStats.grandTotal.toFixed(2)}</span>
                </div>
                <div class="divider"></div>

                <div class="footer">Thank You Visit Again</div>
            </body>
            <script>
                window.onload = () => { window.print(); window.close(); }
            </script>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return createPortal(
        <div className="fixed inset-0 w-full h-[100dvh] z-[9999] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-gradient-to-br from-gray-50 to-white w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95" onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-11 h-11 bg-white/90 backdrop-blur-md shadow-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all z-50 border border-gray-100"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 overflow-y-auto custom-scrollbar flex items-center justify-center bg-gray-100/50 h-full">
                    <div className="bg-white mx-auto shadow-sm border border-gray-200 p-8 font-mono text-black relative" style={{ width: '100%', maxWidth: '380px' }}>
                        <button
                            onClick={handlePrint}
                            className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors no-print"
                            title="Print Thermal Receipt"
                        >
                            <Printer className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6">
                            <img src={EatGreetLogo} alt="EatGreet" className="h-6 mx-auto mb-4 object-contain opacity-70" />
                            {restaurant?.logo && (
                                <img src={restaurant.logo} alt="Restaurant Logo" className="h-12 mx-auto mb-3 object-contain" />
                            )}
                            <h2 className="text-xl font-normal uppercase mb-2 tracking-tight">{restaurant?.name || 'EatGreet Restaurant'}</h2>
                            <p className="text-[12px] leading-tight mb-1 font-normal italic">{restaurant?.address || restaurant?.restaurantDetails?.address || 'Restaurant Address'}</p>
                            {(restaurant?.businessEmail || restaurant?.restaurantDetails?.businessEmail) && (
                                <p className="text-[11px] mb-0.5 opacity-80">Email: {restaurant.businessEmail || restaurant.restaurantDetails.businessEmail}</p>
                            )}
                            {(restaurant?.gstNumber || restaurant?.restaurantDetails?.gstNumber) && (
                                <p className="text-[11px] font-normal">GST: {restaurant.gstNumber || restaurant.restaurantDetails.gstNumber}</p>
                            )}
                            {(restaurant?.contactNumber || restaurant?.restaurantDetails?.contactNumber) && (
                                <p className="text-[11px] text-gray-500 mt-1">Tel: {restaurant.contactNumber || restaurant.restaurantDetails.contactNumber}</p>
                            )}
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Name:</span>
                            <span className="font-normal">{order.customerInfo?.name || 'Guest'}</span>
                        </div>
                        {order.customerInfo?.phone && (
                            <div className="flex justify-between text-[13px] mb-1">
                                <span>Tel:</span>
                                <span className="font-normal">{order.customerInfo.phone}</span>
                            </div>
                        )}
                        <div className="border-t border-dashed border-black my-4"></div>

                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span>Dine In: {order.tableNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Cashier: Admin</span>
                            <span>Bill No: {order.dailySequence ? String(order.dailySequence).padStart(3, '0') : order._id.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Payment:</span>
                            <span>{order.paymentMethod || 'Cash'}</span>
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between font-normal text-[13px] mb-2 uppercase">
                            <span style={{ flex: 1 }}>No.Item</span>
                            <span style={{ width: '30px', textAlign: 'center' }}>Qty</span>
                            <span style={{ width: '60px', textAlign: 'right' }}>Price</span>
                            <span style={{ width: '70px', textAlign: 'right' }}>Amt</span>
                        </div>
                        <div className="border-t border-dashed border-black my-4"></div>

                        <div className="space-y-2 mb-4">
                            {(order.items || []).map((it, i) => (
                                <div key={i} className="flex justify-between text-[13px]">
                                    <span style={{ flex: 1 }}>{i + 1}.{it.name}</span>
                                    <span style={{ width: '30px', textAlign: 'center' }}>{it.quantity || 1}</span>
                                    <span style={{ width: '60px', textAlign: 'right' }}>{(it.price || 0).toFixed(2)}</span>
                                    <span style={{ width: '70px', textAlign: 'right' }}>{(it.price * (it.quantity || 1)).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between font-normal text-[13px] mb-1">
                            <span>Total Qty: {order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}</span>
                            <span>Sub Total: {currencySymbol}{orderStats?.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>CGST@2.5%</span>
                            <span>{currencySymbol}{orderStats?.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>SGST@2.5%</span>
                            <span>{currencySymbol}{orderStats?.sgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-normal text-[13px] mb-1">
                            <span>Total</span>
                            <span>{currencySymbol}{orderStats?.totalRaw.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Round Off</span>
                            <span>{currencySymbol}{orderStats?.roundOff.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between font-normal text-lg mb-4">
                            <span>Grand Total</span>
                            <span>{currencySymbol}{orderStats?.grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="text-center font-normal text-[16px] uppercase tracking-widest mt-6">Thank You Visit Again</div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const AdminSales = () => {
    const { currencySymbol, user } = useSettings();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);

    // State for Date Filter
    // defaulting to empty so it shows "All Time" data initially (per user request "not impact to data")
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // State for Analytics Data (from statsAPI)
    const [analytics, setAnalytics] = useState({
        summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, rangeRevenue: 0, yearlyEBITDA: 0 },
        charts: { hourlyAnalysis: [], revenueTrend: [] }
    });

    // Fetch Restaurant Details on Mount
    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            try {
                const { data } = await restaurantAPI.getDetails();
                setRestaurant(data);
            } catch (error) {
                console.error('Failed to fetch restaurant details', error);
            }
        };
        fetchRestaurantDetails();
    }, []);

    // Fetch Analytics Stats (for Cards and Charts)
    const fetchAnalytics = async () => {
        try {
            const params = {
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            };
            const res = await statsAPI.getAdminStats(params);
            setAnalytics(res.data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        }
    };

    // Fetch Orders List (for Table)
    const fetchOrdersList = async () => {
        setLoading(true);
        try {
            const params = {
                limit: 1000,
                status: 'completed,ready,delivered',
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            };
            const res = await orderAPI.getOrders(params);
            setOrders(res.data || []);
        } catch (error) {
            console.error("Error fetching orders list:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        fetchOrdersList();
    }, [dateRange.start, dateRange.end]);

    // Socket.io Integration for Real-time Updates
    const socket = useSocket();

    useEffect(() => {
        if (!socket || !restaurant?.name) return;

        // Join the restaurant room
        socket.emit('joinRestaurant', restaurant.name);

        const handleOrderUpdate = (payload) => {
            // Re-fetch all data on socket event to keep stats in sync
            fetchAnalytics();
            fetchOrdersList();
        };

        socket.on('orderUpdated', handleOrderUpdate);

        return () => {
            socket.off('orderUpdated', handleOrderUpdate);
        };
    }, [socket, restaurant, currencySymbol]);


    // 1. Filter Orders based on Date Range & Search
    const filteredOrders = useMemo(() => {
        let filtered = orders;

        // Date Filter
        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(o => {
                const d = new Date(o.createdAt);
                return d >= startDate;
            });
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(o => {
                const d = new Date(o.createdAt);
                return d <= endDate;
            });
        }

        // Search Filter (Consolidated - Includes Table Number)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                (o.customerInfo?.name || '').toLowerCase().includes(query) ||
                (o._id || '').toLowerCase().includes(query) ||
                (o.dailySequence || '').toString().includes(query) ||
                (o.tableNumber || '').toString().includes(query)
            );
        }

        // Payment Filter
        if (paymentFilter !== 'All') {
            filtered = filtered.filter(o =>
                (o.paymentMethod || 'Cash').toLowerCase() === paymentFilter.toLowerCase()
            );
        }

        return filtered;
    }, [orders, dateRange, searchQuery, paymentFilter]);

    // 2. Stats Calculation based on Filtered Data
    // 2. Stats for Cards (From Analytics)
    const stats = useMemo(() => {
        const s = analytics.summary || {};
        const isFiltered = !!(dateRange.start || dateRange.end);

        // Determine which revenue and order count to use
        const revenue = isFiltered ? (s.rangeRevenue || 0) : (s.totalRevenue || 0);
        // Fallback to totalOrders if allTimeOrders isn't present
        const orders = isFiltered ? (s.totalOrders || 0) : (s.allTimeOrders || s.totalOrders || 0);

        // Net Profit Logic: Revenue - Expenses
        const monthlyExpense = restaurant?.monthlyExpense || restaurant?.restaurantDetails?.monthlyExpense || 0;
        let totalExpense = 0;

        if (isFiltered && dateRange.start && dateRange.end) {
            // Pro-rate for specific date range
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
            totalExpense = (monthlyExpense / 30) * diffDays;
        } else {
            // For All Time, count how many unique months have data
            const uniqueMonths = new Set(analytics.charts?.revenueTrend?.filter(t => t._id.length === 7).map(t => t._id));
            const activeMonthCount = Math.max(uniqueMonths.size, 1);
            totalExpense = monthlyExpense * activeMonthCount;
        }

        const netProfit = revenue - totalExpense;
        const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

        return {
            revenue,
            orders,
            aov: s.avgOrderValue || 0,
            netProfit: netProfit,
            profitMargin: profitMargin
        };
    }, [analytics, dateRange, restaurant]);

    // 3. Graph Data Preparation (From Analytics)
    const graphData = useMemo(() => {
        const trend = analytics.charts?.revenueTrend || [];
        const isFiltered = !!(dateRange.start || dateRange.end);
        const monthlyExpense = restaurant?.monthlyExpense || restaurant?.restaurantDetails?.monthlyExpense || 0;
        const dailyExpense = monthlyExpense / 30;

        // 1. All Time View (Fixed 12-Month Jan-Dec Axis)
        if (!isFiltered) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            return months.map((monthName, index) => {
                // Find all trend items where month matches current loop index (0-11)
                // Backend returns "YYYY-MM", so we split and check the month part
                const matches = trend.filter(item => {
                    const parts = item._id.split('-'); // ["2026", "02"]
                    if (parts.length < 2) return false;
                    return parseInt(parts[1], 10) - 1 === index;
                });

                const totalRev = matches.reduce((acc, curr) => acc + (curr.total || curr.sales || 0), 0);
                const totalVol = matches.reduce((acc, curr) => acc + (curr.count || 0), 0);

                // Expense Logic:
                // If we found specific month data points (e.g. Feb 2025 and Feb 2026), subtract expense for each.
                // If no data found (e.g. future month), subtract 1 unit of monthly expense to show fixed cost.
                const expenseMultiplier = Math.max(matches.length, 1);
                const totalPeriodExpense = monthlyExpense * expenseMultiplier;

                return {
                    name: monthName,
                    totalRevenue: totalRev,
                    netProfit: totalRev - totalPeriodExpense,
                    volume: totalVol
                };
            });
        }

        // 2. Filtered View (Dynamic Daily/Hourly Axis)
        if (trend.length === 0) return [];

        return trend.map(item => {
            let label = item._id;
            try {
                // For YYYY-MM dates or YYYY-MM-DD, handle parsing safely
                // If length is 7 (YYYY-MM), treat as month start
                const dateStr = item._id.length === 7 ? `${item._id}-01` : item._id;
                const d = new Date(dateStr);

                // Format based on granularity
                // If filtered by range, usually daily data
                label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } catch (e) {
                label = item._id;
            }

            const revenuePoint = item.sales || item.total || 0;

            return {
                name: label,
                totalRevenue: revenuePoint,
                netProfit: revenuePoint - (isFiltered ? dailyExpense : monthlyExpense),
                volume: item.count || 0
            };
        });
    }, [analytics, restaurant, dateRange]);

    // 4. Table Display Data (Directly uses filteredOrders)
    const tableData = filteredOrders;

    // Download PDF Handler
    const handleDownloadPDF = async () => {
        if (!dateRange.start || !dateRange.end) {
            toast.error("Please select and apply a date range first to export the report.");
            return;
        }

        const toastId = toast.loading('Generating PDF report...');
        try {
            // Helper: Safe Currency Formatter for PDF
            const formatCurrencyPDF = (amount) => {
                const val = Number(amount) || 0;
                return `${currencySymbol === '₹' ? 'Rs.' : currencySymbol} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            // Moved loadImage helper to component scope for reuse
            const innerLoadImage = (url) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = url;
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const dataUrl = canvas.toDataURL('image/png');
                            resolve(dataUrl);
                        } catch (e) {
                            resolve(null);
                        }
                    };
                    img.onerror = () => resolve(null);
                });
            };

            // Instantiate jsPDF
            const jsPDFConstructor = jsPDF.default || jsPDF;
            const doc = new jsPDFConstructor();

            // Load Custom Font (Urbanist) - We'll use Helvetica as fallback, but set style to match "Urbanist" look
            // Note: jsPDF default fonts are limited. To use actual Urbanist, we'd need to add the font file as base64.
            // For now, we'll stick to standard sans-serif but style it closer to Urbanist with weights.
            doc.setFont("helvetica");

            // Layout Constants
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPos = 15; // Reduced top margin

            // Brand Colors
            const brandOrange = [253, 105, 65];   // #FD6941
            const textDark = [30, 30, 30];        // Nearly black
            const textGray = [100, 100, 100];     // Gray
            const bgLight = [249, 250, 251];      // Very light gray

            // 1. Header Bar
            doc.setFillColor(...brandOrange);
            doc.rect(0, 0, pageWidth, 4, 'F'); // Thinner bar

            yPos = 12; // Start content higher

            // Restaurant Logo & Info
            let logoImg = null;
            const footerLogoImg = await innerLoadImage(EatGreetLogo);
            const logoUrl = user?.restaurantDetails?.logo || restaurant?.logo || restaurant?.restaurantDetails?.logo || restaurant?.image;

            if (logoUrl) {
                logoImg = await innerLoadImage(logoUrl);
            }

            if (logoImg) {
                const imgProps = doc.getImageProperties(logoImg);
                const ratio = imgProps.width / imgProps.height;
                const w = 24;
                const h = w / ratio;
                doc.addImage(logoImg, 'PNG', margin, yPos, w, h);

                const textX = margin + w + 10;
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...textDark);
                doc.text(restaurant?.name || 'EatGreet Restaurant', textX, yPos + 8);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...textGray);

                let detailsY = yPos + 14;
                if (restaurant?.address) {
                    doc.text(restaurant.address, textX, detailsY);
                    detailsY += 5;
                }
                const contactParts = [];
                if (restaurant?.contactNumber) contactParts.push(`Tel: ${restaurant.contactNumber}`);
                if (restaurant?.businessEmail) contactParts.push(`Email: ${restaurant.businessEmail}`);
                if (contactParts.length > 0) {
                    doc.text(contactParts.join(' | '), textX, detailsY);
                }

                yPos = Math.max(yPos + h + 10, detailsY + 15);
            } else {
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...textDark);
                doc.text(restaurant?.name || 'EatGreet Restaurant', margin, yPos + 8);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...textGray);
                yPos += 16;
                if (restaurant?.address) { doc.text(restaurant.address, margin, yPos); yPos += 5; }
                if (restaurant?.contactNumber) { doc.text(`Tel: ${restaurant.contactNumber}`, margin, yPos); yPos += 5; }
                yPos += 10;
            }

            // Divider
            doc.setDrawColor(230);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 12; // Adjusted spacing

            // 2. Report Title
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            doc.text("Sales Performance Report", margin, yPos);

            // Meta Info
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...textGray);
            const generatedDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
            doc.text(`Report Date: ${generatedDate}`, pageWidth - margin, yPos, { align: 'right' });

            yPos += 8;
            doc.setFontSize(10);
            const periodText = (dateRange.start || dateRange.end)
                ? `${new Date(dateRange.start).toLocaleDateString()}  to  ${new Date(dateRange.end || new Date()).toLocaleDateString()}`
                : "All Time History";
            doc.text(`Period: ${periodText}`, margin, yPos);

            yPos += 15; // Increased to fix overlap

            // 3. Financial Summary (Calculated from Filtered Data)
            // We calculate this on the fly to ensure it matches the selected date range perfectly
            const pdfStats = Array.isArray(filteredOrders) ? filteredOrders.reduce((acc, order) => {
                // Ensure we parse as float to avoid string concatenation if API returns strings
                const orderTotal = Number(order.totalAmount) || 0;
                return {
                    revenue: acc.revenue + orderTotal,
                    orders: acc.orders + 1
                };
            }, { revenue: 0, orders: 0 }) : { revenue: 0, orders: 0 };

            // Calculate Net Profit for this specific range
            // Use safe fallbacks for potentially undefined expense variables
            const safeDailyExpense = typeof dailyExpense !== 'undefined' ? dailyExpense : 0;
            const safeMonthlyExpense = typeof monthlyExpense !== 'undefined' ? monthlyExpense : 0;

            let totalExpenses = 0;
            if (dateRange.start && dateRange.end) {
                const start = new Date(dateRange.start);
                const end = new Date(dateRange.end);
                const daysDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                totalExpenses = safeDailyExpense * daysDiff;
            } else {
                totalExpenses = safeMonthlyExpense; // Fallback
            }

            const pdfRevenue = pdfStats.revenue;
            const pdfOrders = pdfStats.orders;
            const pdfAov = pdfOrders > 0 ? (pdfRevenue / pdfOrders) : 0;
            // Profit is Revenue - Expenses
            const pdfProfit = pdfRevenue - totalExpenses;

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            doc.text("Financial Overview", margin, yPos - 5);

            const summaryData = [
                [
                    { content: 'TOTAL REVENUE', styles: { fontStyle: 'bold', textColor: textGray, fontSize: 8 } },
                    { content: 'NET PROFIT', styles: { fontStyle: 'bold', textColor: textGray, fontSize: 8 } },
                    { content: 'TOTAL ORDERS', styles: { fontStyle: 'bold', textColor: textGray, fontSize: 8 } },
                    { content: 'AVG ORDER VALUE', styles: { fontStyle: 'bold', textColor: textGray, fontSize: 8 } },
                ],
                [
                    { content: formatCurrencyPDF(pdfRevenue), styles: { fontSize: 16, fontStyle: 'bold', textColor: textDark } },
                    { content: formatCurrencyPDF(pdfProfit), styles: { fontSize: 16, fontStyle: 'bold', textColor: brandOrange } },
                    { content: pdfOrders.toString(), styles: { fontSize: 16, fontStyle: 'bold', textColor: textDark } },
                    { content: formatCurrencyPDF(pdfAov), styles: { fontSize: 16, fontStyle: 'bold', textColor: textDark } },
                ]
            ];

            autoTable(doc, {
                startY: yPos,
                body: summaryData,
                theme: 'plain',
                styles: {
                    cellPadding: 4,
                    halign: 'center',
                    font: "helvetica"
                },
                columnStyles: {
                    0: { cellWidth: (pageWidth - margin * 2) / 4 },
                    1: { cellWidth: (pageWidth - margin * 2) / 4 },
                    2: { cellWidth: (pageWidth - margin * 2) / 4 },
                    3: { cellWidth: (pageWidth - margin * 2) / 4 }
                },
                margin: { left: margin, right: margin },
                didParseCell: function (data) {
                    // Background for the whole "card" area
                    data.cell.styles.fillColor = bgLight;
                }
            });

            yPos = doc.lastAutoTable.finalY + 10;

            // 4. Detailed Transactions
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textDark);
            doc.text("Transaction History", margin, yPos);
            yPos += 8;

            const tableColumn = ["Date", "Time", "Order ID", "Customer", "Pay Mode", "Items", "Total"];

            const tableRows = tableData.map(order => [
                new Date(order.createdAt).toLocaleDateString(),
                new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                order.dailySequence ? String(order.dailySequence).padStart(3, '0') : order._id.slice(-6),
                order.customerInfo?.name || 'Guest',
                order.paymentMethod || 'Cash',
                order.items?.length || 0,
                formatCurrencyPDF(order.totalAmount || 0)
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: {
                    fillColor: bgLight,
                    textColor: textGray,
                    fontStyle: 'bold',
                    lineWidth: 0,
                    fontSize: 9,
                    halign: 'center',
                    cellPadding: 3
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: textDark,
                    lineColor: [230, 230, 230],
                    lineWidth: 0.1,
                    font: "helvetica",
                    valign: 'middle',
                    halign: 'center'
                },
                alternateRowStyles: {
                    fillColor: [255, 255, 255]
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 25, fontStyle: 'bold' },
                    6: { fontStyle: 'bold' }
                },
                margin: { left: margin, right: margin, bottom: 25 }
            });

            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                if (footerLogoImg) {
                    const props = doc.getImageProperties(footerLogoImg);
                    const fw = 20;
                    const fh = (props.height / props.width) * fw;
                    doc.addImage(footerLogoImg, 'PNG', margin, pageHeight - 15, fw, fh);
                } else {
                    doc.text("EatGreet", margin, pageHeight - 10);
                }
            }

            const fileName = `Sales_${periodText.replace(/\s+/g, '_').replace(/[:\/,]/g, '')}.pdf`;
            doc.save(fileName);
            toast.success('Report downloaded successfully', { id: toastId });

        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error(`Failed to generate PDF: ${error.message}`, { id: toastId });
        }
    };

    // Download Excel Handler
    const handleDownloadExcel = async () => {
        if (!dateRange.start || !dateRange.end) {
            toast.error("Please select and apply a date range first to export the report.");
            return;
        }

        const toastId = toast.loading('Generating branded Excel report...');
        try {
            // Helper to load image for ExcelJS
            const excelLoadImage = (url) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = url;
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png').split(',')[1]); // Base64 without header
                        } catch (e) { resolve(null); }
                    };
                    img.onerror = () => resolve(null);
                });
            };

            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            // 1. Load Images
            const restaurantLogoBase64 = await excelLoadImage(user?.restaurantDetails?.logo || restaurant?.logo || restaurant?.restaurantDetails?.logo || restaurant?.image);
            const eatGreetLogoBase64 = await excelLoadImage(EatGreetLogo);

            // 2. Calculate Stats (Same logic as PDF)
            const pdfStats = Array.isArray(filteredOrders) ? filteredOrders.reduce((acc, order) => {
                const orderTotal = Number(order.totalAmount) || 0;
                return {
                    revenue: acc.revenue + orderTotal,
                    orders: acc.orders + 1
                };
            }, { revenue: 0, orders: 0 }) : { revenue: 0, orders: 0 };

            const safeDailyExpense = typeof dailyExpense !== 'undefined' ? dailyExpense : 0;
            const safeMonthlyExpense = typeof monthlyExpense !== 'undefined' ? monthlyExpense : 0;

            let totalExpenses = 0;
            if (dateRange.start && dateRange.end) {
                const start = new Date(dateRange.start);
                const end = new Date(dateRange.end);
                const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                totalExpenses = safeDailyExpense * diffDays;
            } else {
                totalExpenses = safeMonthlyExpense;
            }
            const pdfProfit = pdfStats.revenue - totalExpenses;
            const pdfAov = pdfStats.orders > 0 ? (pdfStats.revenue / pdfStats.orders) : 0;

            // 3. Setup Columns & Styling Constants
            const brandOrange = 'FD6941';
            const textDark = '1E1E1E';
            const textGray = '646464';
            const bgLight = 'F9FAFB';

            // Define columns with a balanced buffer A column to push content to the middle
            worksheet.columns = [
                { key: 'buffer', width: 22 },
                { key: 'date', width: 20 },
                { key: 'time', width: 20 },
                { key: 'orderId', width: 20 },
                { key: 'customer', width: 30 },
                { key: 'payMode', width: 20 },
                { key: 'items', width: 15 },
                { key: 'total', width: 25 }
            ];

            // 3. Header Section (Premium Branding matching PDF)
            // Row 1: Brand Top Bar
            const topBarRow = worksheet.addRow(['', '']);
            worksheet.mergeCells('B1:H1');
            topBarRow.height = 8;
            worksheet.getCell('B1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandOrange } };

            // Row 2: Logo and Name
            const restaurantTitleRow = worksheet.addRow(['', restaurant?.name || 'EatGreet Restaurant']);
            worksheet.mergeCells('B2:H2');
            const titleCell = worksheet.getCell('B2');
            titleCell.font = { size: 32, bold: true, color: { argb: textDark } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            restaurantTitleRow.height = 90;

            if (restaurantLogoBase64) {
                const logoId = workbook.addImage({ base64: restaurantLogoBase64, extension: 'png' });
                // Position logo closer to the centered title for a unified look
                worksheet.addImage(logoId, {
                    tl: { col: 3.8, row: 1.1 }, // Moved to 3.8 to sit tightly next to the title
                    ext: { width: 80, height: 80 },
                    editAs: 'oneCell'
                });
            }

            // Row 3: Address
            const address = restaurant?.address || restaurant?.restaurantDetails?.address || 'Restaurant Address';
            const addressRow = worksheet.addRow(['', address]);
            worksheet.mergeCells('B3:H3');
            const addressCell = worksheet.getCell('B3');
            addressCell.font = { size: 12, color: { argb: textGray } };
            addressCell.alignment = { vertical: 'middle', horizontal: 'center' };
            addressRow.height = 25;

            // Row 4: Contact Details
            const contactParts = [];
            const tel = restaurant?.contactNumber || restaurant?.restaurantDetails?.contactNumber;
            const email = restaurant?.businessEmail || restaurant?.restaurantDetails?.businessEmail;
            const gst = restaurant?.gstNumber || restaurant?.restaurantDetails?.gstNumber;

            if (tel) contactParts.push(`Tel: ${tel}`);
            if (email) contactParts.push(`Email: ${email}`);
            if (gst) contactParts.push(`GST: ${gst}`);

            const contactRow = worksheet.addRow(['', contactParts.join('   |   ') || 'Contact details not available']);
            worksheet.mergeCells('B4:H4');
            const contactCell = worksheet.getCell('B4');
            contactCell.font = { size: 10, color: { argb: textGray } };
            contactCell.alignment = { vertical: 'middle', horizontal: 'center' };
            contactRow.height = 20;

            worksheet.addRow([]); // Spacer Row 5

            // Row 6: Report Title 
            const reportSubtitle = worksheet.addRow(['', 'Sales Performance Report']);
            worksheet.mergeCells('B6:H6');
            const subtitleCell = worksheet.getCell('B6');
            subtitleCell.font = { size: 22, bold: true, color: { argb: textDark } };
            subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            reportSubtitle.height = 40;

            // Row 7: Report Date & Period
            const periodText = (dateRange.start || dateRange.end) ?
                `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end || new Date()).toLocaleDateString()}` : "All Time History";
            const metaInfo = worksheet.addRow(['', `Generated: ${new Date().toLocaleString()}   |   Period: ${periodText}`]);
            worksheet.mergeCells('B7:H7');
            const metaCell = worksheet.getCell('B7');
            metaCell.font = { size: 11, italic: true, color: { argb: textGray } };
            metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
            metaInfo.height = 30;

            worksheet.addRow([]); // Spacer Row 8

            // 4. Financial Overview Section
            const overviewHeader = worksheet.addRow(['', 'FINANCIAL OVERVIEW']);
            worksheet.mergeCells(`B${overviewHeader.number}:H${overviewHeader.number}`);
            const oHeaderCell = worksheet.getCell(`B${overviewHeader.number}`);
            oHeaderCell.font = { size: 14, bold: true, color: { argb: textDark } };
            oHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgLight } };
            oHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
            overviewHeader.height = 35;

            // Distribute stats across B:H
            const statsLabels = worksheet.addRow(['', 'TOTAL REVENUE', '', 'NET PROFIT', '', 'TOTAL ORDERS', 'AVG ORDER VALUE', '']);
            worksheet.mergeCells(`B${statsLabels.number}:C${statsLabels.number}`);
            worksheet.mergeCells(`D${statsLabels.number}:E${statsLabels.number}`);
            worksheet.mergeCells(`G${statsLabels.number}:H${statsLabels.number}`);
            statsLabels.font = { size: 11, bold: true, color: { argb: textGray } };
            statsLabels.alignment = { horizontal: 'center' };
            statsLabels.height = 25;

            const statsValues = worksheet.addRow([
                '',
                pdfStats.revenue,
                '',
                pdfProfit,
                '',
                pdfStats.orders,
                pdfAov,
                ''
            ]);
            worksheet.mergeCells(`B${statsValues.number}:C${statsValues.number}`);
            worksheet.mergeCells(`D${statsValues.number}:E${statsValues.number}`);
            worksheet.mergeCells(`G${statsValues.number}:H${statsValues.number}`);
            statsValues.height = 45;

            statsValues.eachCell((cell, colNumber) => {
                if (colNumber > 1) {
                    cell.font = { size: 18, bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });

            statsValues.getCell(2).font = { color: { argb: textDark }, size: 18, bold: true };
            statsValues.getCell(4).font = { color: { argb: brandOrange }, size: 18, bold: true };

            // Format Currency for B (2), D (4), and G (7)
            [2, 4, 7].forEach(col => {
                statsValues.getCell(col).numFmt = `${currencySymbol === '₹' ? '₹' : '"' + currencySymbol + '"'}#,##0.00`;
            });

            worksheet.addRow([]); // Spacer

            // 5. Transaction History Section
            const transHeader = worksheet.addRow(['', 'TRANSACTION HISTORY']);
            worksheet.mergeCells(`B${transHeader.number}:H${transHeader.number}`);
            const tHeaderCell = worksheet.getCell(`B${transHeader.number}`);
            tHeaderCell.font = { size: 14, bold: true, color: { argb: textDark } };
            tHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgLight } };
            tHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
            transHeader.height = 35;

            const tableHeaderRow = worksheet.addRow(['', 'Date', 'Time', 'Order ID', 'Customer', 'Pay Mode', 'Items', 'Total']);
            tableHeaderRow.eachCell((cell, colNumber) => {
                if (colNumber > 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandOrange } };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFFFFF' } },
                        bottom: { style: 'thin', color: { argb: 'E5E7EB' } }
                    };
                }
            });
            tableHeaderRow.height = 40;

            // 6. Add Data Rows
            filteredOrders.forEach(order => {
                const row = worksheet.addRow([
                    '',
                    new Date(order.createdAt).toLocaleDateString(),
                    new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    order.dailySequence ? String(order.dailySequence).padStart(3, '0') : (order._id || '').slice(-6).toUpperCase(),
                    order.customerInfo?.name || 'Guest',
                    order.paymentMethod || 'Cash',
                    order.items?.length || 0,
                    Number(order.totalAmount) || 0
                ]);
                row.height = 30;

                // Explicitly center all cells in the row starting from col 2
                row.eachCell((cell, colNumber) => {
                    if (colNumber > 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        if (colNumber === 8) {
                            cell.numFmt = `${currencySymbol === '₹' ? '₹' : '"' + currencySymbol + '"'}#,##0.00`;
                        }
                        if (colNumber === 4) {
                            cell.font = { bold: true };
                        }
                    }
                });
            });

            // Alternate Row Styling
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > tableHeaderRow.number) {
                    if (rowNumber % 2 === 0) {
                        row.eachCell((cell, colNumber) => {
                            if (colNumber > 1) {
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
                            }
                        });
                    }
                }
            });

            // 7. Footer Branding (Powered by EatGreet)
            worksheet.addRow([]); // Minimal spacer

            const footerRow = worksheet.addRow(['', '', '', 'Powered by', '']);
            footerRow.height = 60;

            // Apply background and borders to the whole footer area (B:H)
            ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
                const cell = footerRow.getCell(col);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FEDFD7' } },
                    bottom: { style: 'thin', color: { argb: 'FEDFD7' } }
                };
            });

            // Style the "Powered by" text to sit left of center
            const pByCell = footerRow.getCell(4); // Column D
            pByCell.font = { size: 12, italic: true, color: { argb: textGray } };
            pByCell.alignment = { horizontal: 'right', vertical: 'middle' };

            if (eatGreetLogoBase64) {
                const eatGreetLogoId = workbook.addImage({ base64: eatGreetLogoBase64, extension: 'png' });
                // Place logo starting from Column E (index 4.1 in 0-indexed terms but col 5 in 1-indexed)
                // tl.col: 4 means Column E
                worksheet.addImage(eatGreetLogoId, {
                    tl: { col: 4.1, row: footerRow.number - 0.9 },
                    ext: { width: 140, height: 45 },
                    editAs: 'oneCell'
                });
            }
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            const safeFileName = `Sales_${periodText.replace(/\s+/g, '_').replace(/[:\/,]/g, '')}.xlsx`;
            anchor.download = safeFileName;
            anchor.click();
            window.URL.revokeObjectURL(url);

            toast.success('Branded Excel report downloaded', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate branded Excel', { id: toastId });
        }
    };

    return (
        <div className="space-y-6 pb-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[20px] sm:text-[24px] lg:text-[30px] font-normal text-black tracking-tight leading-none">Sales Dashboard</h1>
                    <p className="text-[12px] sm:text-[18px] text-gray-400 font-normal">Financial Overview & Analytics</p>
                </div>
                <div className="flex flex-row items-center justify-end gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1">
                    <div className="flex items-center shrink-0">
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="bg-white border border-gray-100 text-gray-700 text-[10px] sm:text-[13px] rounded-full px-4 sm:px-6 py-2 sm:py-3 outline-none shadow-sm transition-all hover:border-gray-300 flex items-center gap-2 font-normal"
                        >
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                            {dateRange.start ? (
                                <span>
                                    {new Date(dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    <span className="mx-1 text-gray-300">-</span>
                                    {dateRange.end ? new Date(dateRange.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                </span>
                            ) : (
                                <span className="text-gray-400">Select Date Range</span>
                            )}                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ml-1" />
                        </button>

                    </div>

                    {/* Render DatePicker conditionally outside the button but relative to it if needed, or just as a modal */}
                    {isDatePickerOpen && (
                        <DateRangePicker
                            range={dateRange}
                            onChange={(newRange) => {
                                setDateRange(newRange);
                            }}
                            onClose={() => setIsDatePickerOpen(false)}
                        />
                    )}

                    <button
                        onClick={handleDownloadPDF}
                        className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white h-9 sm:h-12 px-3 sm:px-6 rounded-full font-normal flex items-center justify-center gap-2 shrink-0 transition-all duration-300 shadow-sm text-sm"
                        title="Download PDF Report"
                    >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span className="hidden sm:block whitespace-nowrap">
                            PDF Report
                        </span>
                    </button>

                    <button
                        onClick={handleDownloadExcel}
                        className="bg-green-600 hover:bg-green-700 text-white h-9 sm:h-12 px-3 sm:px-6 rounded-full font-normal flex items-center justify-center gap-2 shrink-0 transition-all duration-300 shadow-sm shadow-green-100 text-sm"
                        title="Download Excel Report"
                    >
                        <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span className="hidden sm:block whitespace-nowrap">
                            Excel Report
                        </span>
                    </button>
                </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* 1. Total Revenue */}
                <SalesCard
                    title="Total Revenue"
                    mobileTitle="Revenue"
                    value={formatCurrency(stats.revenue, currencySymbol)}
                    subValue={dateRange.start ? "Period Revenue" : "All Time Revenue"}
                    icon={DollarSign}
                />

                {/* 2. Net Profit */}
                <SalesCard
                    title="Net Profit"
                    mobileTitle="Profit"
                    value={formatCurrency(stats.netProfit, currencySymbol)}
                    subValue="Revenue - Expenses"
                    icon={TrendingUp}
                />

                {/* 3. Avg Order Value (AOV) */}
                <SalesCard
                    title="Avg Order Value (AOV)"
                    mobileTitle="AOV"
                    value={formatCurrency(stats.aov, currencySymbol)}
                    subValue="Average per order"
                    icon={Activity}
                />

                {/* 4. Total Orders */}
                <SalesCard
                    title="Total Orders"
                    mobileTitle="Orders"
                    value={stats.orders}
                    subValue={dateRange.start ? "Period Orders" : "All Time Orders"}
                    icon={ShoppingBag}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Graph: Sales & Net Profit */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-[16px] sm:text-[24px] font-normal text-black">Revenue & Net Profit</h3>
                        <p className="text-[10px] text-gray-400 font-normal">Monthly breakdown of sales and actual earnings</p>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FD6941" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#FD6941" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f3f3" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                    minTickGap={10}
                                />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        background: '#fff',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[12px] font-normal text-slate-600 mr-4">{value}</span>}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="totalRevenue"
                                    name="Total Revenue"
                                    stroke="#FD6941"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={3}
                                    animationDuration={1500}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="netProfit"
                                    name="Net Profit"
                                    stroke="#000000"
                                    fillOpacity={1}
                                    fill="url(#colorProfit)"
                                    strokeWidth={3}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Graph: Total Volume */}
                <div className="lg:col-span-1 bg-white p-6 rounded-[1.5rem] shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-[16px] sm:text-[24px] font-normal text-black">Total Orders</h3>
                        <p className="text-[12px] text-gray-400 font-normal">Number of orders per period</p>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f3f3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} minTickGap={10} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="volume" name="Orders" fill="#FD6941" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[1.5rem] shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <h3 className="text-[16px] sm:text-[24px] font-normal text-black">Transaction History</h3>
                        <p className="text-[12px] text-gray-400 font-normal">Detailed list of past orders</p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:flex-none">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-9 sm:pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs sm:text-sm focus:ring-1 focus:ring-black transition-all outline-none"
                            />
                            <Search className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 sm:py-2.5 rounded-full border text-xs sm:text-sm font-normal transition-all ${paymentFilter !== 'All' ? 'bg-[#FD6941] text-white border-[#FD6941]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                title="Filter Transactions"
                            >
                                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline ml-2">{paymentFilter === 'All' ? 'Filter' : paymentFilter}</span>
                                <ChevronDown className="hidden sm:inline ml-1 w-3.5 h-3.5" />
                            </button>

                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-3 py-1.5 font-normal text-gray-400 uppercase tracking-wider text-[10px]">Payment Mode</div>
                                        {['All', 'Cash', 'Online'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => {
                                                    setPaymentFilter(mode);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs sm:text-sm font-normal hover:bg-[#FD6941] transition-colors ${paymentFilter === mode ? 'text-[#FD6941] bg-[#FD6941]' : 'text-gray-600'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="block sm:hidden divide-y divide-gray-50 p-2">
                    {tableData.length > 0 ? (
                        tableData.map((order) => (
                            <div key={order._id} className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm mb-3 flex items-center justify-between gap-3 group">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-transparent group-hover:scale-105 transition-transform">
                                        <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900  truncate">#{order.dailySequence || (order._id || '').slice(-6).toUpperCase()}</p>
                                            <span className="text-[9px] text-gray-400 font-normal bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 italic">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${(order.paymentMethod || 'Cash').toLowerCase() === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                {order.paymentMethod || 'Cash'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-normal">
                                                {order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0} items
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <p className="text-sm font-bold text-gray-900 leading-none">{formatCurrency(order.totalAmount, currencySymbol)}</p>
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-1.5 bg-[#FD6941] text-white rounded-lg text-xs font-normal hover:bg-[#FD6941] transition-all active:scale-95 shadow-sm "
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-normal">No transactions found</p>
                        </div>
                    )}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-normal">Order ID</th>
                                <th className="px-6 py-4 font-normal">Date & Time</th>
                                <th className="px-6 py-4 font-normal text-center">Payment</th>
                                <th className="px-6 py-4 font-normal text-center">Quantity</th>
                                <th className="px-6 py-4 font-normal text-right">Tax (10%)</th>
                                <th className="px-6 py-4 font-normal text-right">Total Amount</th>
                                <th className="px-6 py-4 font-normal text-center">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tableData.length > 0 ? (
                                tableData.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-normal text-black">
                                            #{order.dailySequence || (order._id || '').slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-normal ${(order.paymentMethod || 'Cash') === 'Online'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {order.paymentMethod || 'Cash'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-center">
                                            {order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right">
                                            {formatCurrency((order.totalAmount || 0) * 0.10, currencySymbol)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-normal text-black text-right">
                                            {formatCurrency(order.totalAmount || 0, currencySymbol)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="w-8 h-8 rounded-full bg-[#FD6941] text-white flex items-center justify-center hover:bg-[#FD6941] transition-all active:scale-95 shadow-md hover:shadow-lg  mx-auto"
                                                title="View Invoice"
                                            >
                                                <FileText size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        No sales data found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Modal */}
            <InvoiceModal
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                currencySymbol={currencySymbol}
                restaurant={user?.restaurantDetails || restaurant}
            />
        </div>
    );
};

export default AdminSales;
