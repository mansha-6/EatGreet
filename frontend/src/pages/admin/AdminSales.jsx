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
const formatCurrency = (amount, symbol = '₹') => {
    if (amount === undefined || amount === null) return `${symbol}0.00`;
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatOrderDisplayId = (order) => {
    if (!order) return 'N/A';
    const date = new Date(order.createdAt);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    const sequence = order.dailySequence ? String(order.dailySequence).padStart(2, '0') : (order._id ? order._id.slice(-2).toUpperCase() : '00');
    return `${dd}${mm}${yy}${sequence}`;
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
                    .restaurant-name { font-size: 18px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
                    .restaurant-info { font-size: 12px; margin-bottom: 2px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; }
                    .table-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
                    .powered-by { text-align: center; font-size: 10px; color: #6b7280; margin-top: 6px; letter-spacing: 0.08em; text-transform: uppercase; }
                    .footer-logo { display: block; height: 22px; width: auto; margin: 4px auto 0; opacity: 0.45; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${restaurant?.logo ? `<img src="${restaurant.logo}" style="height: 50px; width: auto; margin-bottom: 10px;" />` : ''}
                    <div class="restaurant-name">${restaurant?.name || 'EatGreet Restaurant'}</div>
                    <div class="restaurant-info" style="margin-top: 5px; font-weight: 700;">${restaurant?.address || restaurant?.restaurantDetails?.address || 'Restaurant Address'}</div>
                    ${(restaurant?.businessEmail || restaurant?.restaurantDetails?.businessEmail) ? `<div class="restaurant-info">Email: ${restaurant.businessEmail || restaurant.restaurantDetails.businessEmail}</div>` : ''}
                    ${(restaurant?.gstNumber || restaurant?.restaurantDetails?.gstNumber) ? `<div class="restaurant-info">GST: ${restaurant.gstNumber || restaurant.restaurantDetails.gstNumber}</div>` : ''}
                    ${(restaurant?.contactNumber || restaurant?.restaurantDetails?.contactNumber) ? `<div class="restaurant-info" style="margin-top: 2px;">Tel: ${restaurant.contactNumber || restaurant.restaurantDetails.contactNumber}</div>` : ''}
                </div>

                <div class="divider"></div>
                <div class="info-row"><span>Name:</span> <span style="font-weight: 700;">${order.customerInfo?.name || 'Guest'}</span></div>
                ${order.customerInfo?.phone ? `<div class="info-row"><span>Tel:</span> <span style="font-weight: 700;">${order.customerInfo.phone}</span></div>` : ''}
                <div class="divider"></div>

                <div class="info-row">
                    <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>Table: ${order.tableNumber || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>Bill No: ${formatOrderDisplayId(order)}</span>
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
                <div class="info-row" style="font-weight: 700;">
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
                <div class="info-row" style="font-weight: 700;">
                    <span>Total</span>
                    <span>${currencySymbol}${orderStats.totalRaw.toFixed(2)}</span>
                </div>
                <div class="divider"></div>
                <div class="info-row">
                    <span>Round Off</span>
                    <span>${currencySymbol}${orderStats.roundOff.toFixed(2)}</span>
                </div>
                <div class="info-row" style="font-size: 16px; font-weight: 700;">
                    <span>Grand Total</span>
                    <span>${currencySymbol}${orderStats.grandTotal.toFixed(2)}</span>
                </div>
                <div class="divider"></div>

                <div class="footer">Thank You Visit Again</div>
                <div class="powered-by">Powered by</div>
                <img src="${EatGreetLogo}" class="footer-logo" alt="EatGreet" />
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
        <div className="fixed inset-0 w-full h-[100dvh] z-[9999] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-200" onClick={onClose}>
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
                            {restaurant?.logo && (
                                <img src={restaurant.logo} alt="Restaurant Logo" className="h-14 mx-auto mb-2 object-contain" />
                            )}
                            <h2 className="text-xl font-bold uppercase mb-2 tracking-tight">{restaurant?.name || 'EatGreet Restaurant'}</h2>
                            <p className="text-[12px] leading-tight mb-1 font-bold italic">{restaurant?.address || restaurant?.restaurantDetails?.address || 'Restaurant Address'}</p>
                            {(restaurant?.businessEmail || restaurant?.restaurantDetails?.businessEmail) && (
                                <p className="text-[11px] mb-0.5 opacity-80">Email: {restaurant.businessEmail || restaurant.restaurantDetails.businessEmail}</p>
                            )}
                            {(restaurant?.gstNumber || restaurant?.restaurantDetails?.gstNumber) && (
                                <p className="text-[11px] font-bold">GST: {restaurant.gstNumber || restaurant.restaurantDetails.gstNumber}</p>
                            )}
                            {(restaurant?.contactNumber || restaurant?.restaurantDetails?.contactNumber) && (
                                <p className="text-[11px] text-gray-500 mt-1">Tel: {restaurant.contactNumber || restaurant.restaurantDetails.contactNumber}</p>
                            )}
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Name:</span>
                            <span className="font-bold">{order.customerInfo?.name || 'Guest'}</span>
                        </div>
                        {order.customerInfo?.phone && (
                            <div className="flex justify-between text-[13px] mb-1">
                                <span>Tel:</span>
                                <span className="font-bold">{order.customerInfo.phone}</span>
                            </div>
                        )}
                        <div className="border-t border-dashed border-black my-4"></div>

                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span>Table: {order.tableNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Cashier: Admin</span>
                            <span>Bill No: {formatOrderDisplayId(order)}</span>
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between font-bold text-[13px] mb-2 uppercase">
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
                        <div className="flex justify-between font-bold text-[13px] mb-1">
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
                        <div className="flex justify-between font-bold text-[13px] mb-1">
                            <span>Total</span>
                            <span>{currencySymbol}{orderStats?.totalRaw.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] mb-1">
                            <span>Round Off</span>
                            <span>{currencySymbol}{orderStats?.roundOff.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="flex justify-between font-bold text-lg mb-4">
                            <span>Grand Total</span>
                            <span>{currencySymbol}{orderStats?.grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-black my-4"></div>
                        <div className="text-center font-bold text-[13px] uppercase tracking-widest mt-4 mb-1">THANK YOU VISIT AGAIN</div>
                        <div className="flex flex-col items-center mt-4">
                            <img src={EatGreetLogo} alt="Powered by EatGreet" className="h-8 opacity-40 mb-1" style={{ filter: 'grayscale(1)' }} />
                            <span className="text-[10px] text-gray-400">Powered by EatGreet</span>
                        </div>
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
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // State for Analytics Data
    const [analytics, setAnalytics] = useState({
        summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, rangeRevenue: 0 },
        charts: { revenueTrend: [] }
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

    const fetchData = async () => {
        try {
            const params = {
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            };
            const [resStats, resOrders] = await Promise.all([
                statsAPI.getAdminStats(params),
                orderAPI.getOrders({ ...params, limit: 1000, status: 'completed,ready,delivered' })
            ]);
            setAnalytics(resStats.data);
            setOrders(resOrders.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange.start, dateRange.end]);

    // Socket.io Integration
    const socket = useSocket();
    useEffect(() => {
        if (!socket || !restaurant?.name) return;
        socket.emit('joinRestaurant', restaurant.name);
        socket.on('orderUpdated', fetchData);
        return () => {
            socket.off('orderUpdated', fetchData);
        };
    }, [socket, restaurant]);


    // Filter Orders based on Date Range & Search
    const filteredOrders = useMemo(() => {
        let filtered = orders;

        // Search Filter (No # in ID search)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                (o.customerInfo?.name || '').toLowerCase().includes(query) ||
                (o._id || '').toLowerCase().includes(query) ||
                (o.dailySequence || '').toString().includes(query)
            );
        }

        // Payment Filter
        if (paymentFilter !== 'All') {
            filtered = filtered.filter(o =>
                (o.paymentMethod || 'Cash').toLowerCase() === paymentFilter.toLowerCase()
            );
        }

        return filtered;
    }, [orders, searchQuery, paymentFilter]);

    // Stats Calculation
    const stats = useMemo(() => {
        const s = analytics.summary || {};
        const isFiltered = !!(dateRange.start || dateRange.end);

        const revenue = isFiltered ? (s.rangeRevenue || 0) : (s.totalRevenue || 0);
        const orders = isFiltered ? (s.totalOrders || 0) : (s.allTimeOrders || s.totalOrders || 0);

        const monthlyExpense = restaurant?.monthlyExpense || restaurant?.restaurantDetails?.monthlyExpense || 0;
        let totalExpense = 0;

        if (isFiltered && dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
            totalExpense = (monthlyExpense / 30) * diffDays;
        } else {
            const uniqueMonths = new Set(analytics.charts?.revenueTrend?.filter(t => t._id.length === 7).map(t => t._id));
            totalExpense = monthlyExpense * Math.max(uniqueMonths.size, 1);
        }

        const tax = revenue * 0.05;
        const netProfit = revenue - totalExpense - tax;

        return {
            revenue,
            orders,
            aov: s.avgOrderValue || 0,
            netProfit,
            tax
        };
    }, [analytics, dateRange, restaurant]);

    // Graph Data
    const graphData = useMemo(() => {
        const trend = analytics.charts?.revenueTrend || [];
        const isFiltered = !!(dateRange.start || dateRange.end);
        const monthlyEx = restaurant?.monthlyExpense || restaurant?.restaurantDetails?.monthlyExpense || 0;
        const dailyEx = monthlyEx / 30;

        if (!isFiltered) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return months.map((monthName, index) => {
                const matches = trend.filter(item => {
                    const parts = item._id.split('-');
                    return parts.length >= 2 && parseInt(parts[1], 10) - 1 === index;
                });
                const totalRev = matches.reduce((acc, curr) => acc + (curr.total || 0), 0);
                const tax = totalRev * 0.05;
                const expense = monthlyEx * Math.max(matches.length, 1);
                return {
                    name: monthName,
                    totalRevenue: totalRev,
                    netProfit: totalRev - expense - tax,
                    volume: matches.reduce((acc, curr) => acc + (curr.count || 0), 0)
                };
            });
        }

        return trend.map(item => {
            const revenuePoint = item.total || 0;
            const tax = revenuePoint * 0.05;
            return {
                name: item._id,
                totalRevenue: revenuePoint,
                netProfit: revenuePoint - dailyEx - tax,
                volume: item.count || 0
            };
        });
    }, [analytics, restaurant, dateRange]);

    // Download PDF Handler
    const handleDownloadPDF = async () => {
        if (!dateRange.start || !dateRange.end) {
            toast.error("Please select a date range first.");
            return;
        }

        const toastId = toast.loading('Generating PDF report...');
        try {
            const formatCurrencyPDF = (amount) => `Rs. ${(Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            const innerLoadImage = (url) => new Promise((resolve) => {
                const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = url;
                img.onload = () => { try { const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; canvas.getContext('2d').drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png')); } catch (e) { resolve(null); } };
                img.onerror = () => resolve(null);
            });

            const doc = new jsPDF();
            const brandOrange = [253, 105, 65]; const textDark = [30, 30, 30]; const textGray = [100, 100, 100]; const bgLight = [249, 250, 251];
            doc.setFillColor(...brandOrange); doc.rect(0, 0, 210, 4, 'F');

            let yPos = 15;
            const logoUrl = user?.restaurantDetails?.logo || restaurant?.logo || restaurant?.image;
            const logoImg = logoUrl ? await innerLoadImage(logoUrl) : null;
            const footerLogo = await innerLoadImage(EatGreetLogo);

            if (logoImg) {
                const imgProps = doc.getImageProperties(logoImg);
                const w = 24; const h = w / (imgProps.width / imgProps.height);
                doc.addImage(logoImg, 'PNG', 15, yPos, w, h);
                doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...textDark).text(restaurant?.name || 'Restaurant', 15 + w + 8, yPos + 6);
                doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(...textGray).text(restaurant?.address || user?.restaurantDetails?.address || '', 15 + w + 8, yPos + 11);
                const contactInfo = `Tel: ${restaurant?.contactNumber || user?.restaurantDetails?.contactNumber || user?.phone || 'N/A'}  |  Email: ${restaurant?.businessEmail || restaurant?.email || user?.restaurantDetails?.businessEmail || user?.email || 'N/A'}`;
                doc.text(contactInfo, 15 + w + 8, yPos + 16);
                doc.text(`GST No: ${restaurant?.gstNumber || restaurant?.gstNo || user?.restaurantDetails?.gstNumber || 'N/A'}`, 15 + w + 8, yPos + 21);
                yPos += Math.max(h + 10, 30);
            } else {
                doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(...textDark).text(restaurant?.name || 'Restaurant', 15, yPos + 8);
                yPos += 20;
            }

            doc.setDrawColor(230).setLineWidth(0.5).line(15, yPos, 195, yPos); yPos += 12;
            doc.setFontSize(18).setFont("helvetica", "bold").setTextColor(...textDark).text("Sales Performance Report", 15, yPos);
            doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(...textGray).text(`Report Date: ${new Date().toLocaleString()}`, 195, yPos, { align: 'right' });
            const periodStr = `Period: ${dateRange.start} - ${dateRange.end || 'Today'}`;
            doc.setFontSize(9).text(periodStr, 15, yPos + 6);
            yPos += 18;

            // Financial Summary
            const pdfStats = filteredOrders.reduce((acc, o) => ({ rev: acc.rev + (Number(o.totalAmount) || 0), count: acc.count + 1 }), { rev: 0, count: 0 });
            const monthlyEx = restaurant?.monthlyExpense || restaurant?.restaurantDetails?.monthlyExpense || 0;
            const days = Math.max(1, Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24)));
            const totalExp = (monthlyEx / 30) * days;
            const taxAmt = pdfStats.rev * 0.05;
            const profit = pdfStats.rev - totalExp - taxAmt;

            const summaryData = [
                ['TOTAL REVENUE', 'TOTAL EXPENSES', 'TOTAL TAX (5%)', 'NET PROFIT', 'TOTAL ORDERS', 'AVG VALUE'],
                [formatCurrencyPDF(pdfStats.rev), formatCurrencyPDF(totalExp), formatCurrencyPDF(taxAmt), formatCurrencyPDF(profit), pdfStats.count.toString(), formatCurrencyPDF(pdfStats.count > 0 ? pdfStats.rev / pdfStats.count : 0)]
            ];

            autoTable(doc, {
                startY: yPos, body: summaryData, theme: 'plain', styles: { halign: 'center', cellPadding: 4, font: "helvetica", fontSize: 8 },
                didParseCell: (d) => { d.cell.styles.fillColor = bgLight; if (d.row.index === 1) d.cell.styles.fontSize = 12; if (d.row.index === 1 && d.column.index === 3) d.cell.styles.textColor = brandOrange; }
            });

            yPos = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(...textDark).text("Transaction History", 15, yPos); yPos += 8;

            const tableColumn = ["Date", "Time", "Order ID", "Customer", "Pay Mode", "Items", "Tax (5%)", "Total"];
            const tableRows = filteredOrders.map(o => [
                new Date(o.createdAt).toLocaleDateString(),
                new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                formatOrderDisplayId(o),
                o.customerInfo?.name || 'Guest',
                o.paymentMethod || 'Cash',
                o.items?.length || 0,
                formatCurrencyPDF((o.totalAmount || 0) * 0.05),
                formatCurrencyPDF(o.totalAmount || 0)
            ]);

            autoTable(doc, {
                startY: yPos, head: [tableColumn], body: tableRows, theme: 'grid', styles: { fontSize: 8, halign: 'center', font: "helvetica" },
                headStyles: { fillColor: bgLight, textColor: textGray, fontStyle: 'bold' },
                margin: { bottom: 25 }
            });

            const pages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setTextColor(150).text(`Page ${i} of ${pages}`, 195, 287, { align: 'right' });

                if (footerLogo) {
                    doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(200).text("POWERED BY", 15, 285);
                    doc.addImage(footerLogo, 'PNG', 34, 281.5, 18, 4.5);
                }
            }

            doc.save(`Sales_Report.pdf`);
            toast.success('Report downloaded', { id: toastId });
        } catch (error) {
            console.error(error); toast.error('Failed to generate PDF', { id: toastId });
        }
    };

    // Download Excel Handler
    const handleDownloadExcel = async () => {
        if (!dateRange.start || !dateRange.end) {
            toast.error("Please select a date range first.");
            return;
        }

        const toastId = toast.loading('Generating Excel report...');
        try {
            const excelLoadImage = (url) => new Promise((resolve) => {
                const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = url;
                img.onload = () => { try { const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; canvas.getContext('2d').drawImage(img, 0, 0); resolve(canvas.toDataURL('image/png').split(',')[1]); } catch (e) { resolve(null); } };
                img.onerror = () => resolve(null);
            });

            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            const resLogo = await excelLoadImage(user?.restaurantDetails?.logo || restaurant?.logo || restaurant?.image);
            const egLogo = await excelLoadImage(EatGreetLogo);

            const brandOrange = 'FD6941'; const textDark = '1E1E1E'; const textGray = '646464'; const bgLight = 'FFFFFF';

            worksheet.views = [{ showGridLines: false }];

            worksheet.columns = [
                { key: 'spacer', width: 4 },    // A (Margin)
                { key: 'date', width: 18 },      // B
                { key: 'time', width: 18 },      // C
                { key: 'orderId', width: 18 },   // D
                { key: 'customer', width: 32 },  // E
                { key: 'payMode', width: 18 },   // F
                { key: 'items', width: 15 },     // G
                { key: 'tax', width: 22 },       // H
                { key: 'total', width: 22 }      // I
            ];

            // Row 1: Brand Top Border
            worksheet.addRow([]);
            worksheet.mergeCells('B1:I1');
            worksheet.getCell('B1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandOrange } };

            // Row 2: Premium Header (Logo + Name)
            const headerRow = worksheet.addRow(['', '']);
            headerRow.height = 95;
            worksheet.mergeCells('B2:I2');
            const headerCell = worksheet.getCell('B2');
            headerCell.value = (restaurant?.name || 'Restaurant').toUpperCase();
            headerCell.font = { size: 36, bold: true, color: { argb: textDark } };
            headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // Premium Logo Positioning
            if (resLogo) {
                const logoId = workbook.addImage({ base64: resLogo, extension: 'png' });
                // Position to the left of the centered name
                worksheet.addImage(logoId, {
                    tl: { col: 3.5, row: 1.15 },
                    ext: { width: 90, height: 90 }
                });
            }

            // Row 3: Address
            const addrRow = worksheet.addRow(['', restaurant?.address || user?.restaurantDetails?.address || 'Restaurant Address']);
            worksheet.mergeCells('B3:I3');
            const ac = worksheet.getCell('B3');
            ac.font = { size: 11, color: { argb: textGray }, italic: true };
            ac.alignment = { horizontal: 'center', vertical: 'top' };
            addrRow.height = 20;

            // Row 4: Contact info (Tel, Email, GST)
            const contactText = `Tel: ${restaurant?.contactNumber || user?.restaurantDetails?.contactNumber || user?.phone || 'N/A'}   |   Email: ${restaurant?.businessEmail || restaurant?.email || user?.restaurantDetails?.businessEmail || user?.email || 'N/A'}   |   GST No: ${restaurant?.gstNumber || restaurant?.gstNo || user?.restaurantDetails?.gstNumber || 'N/A'}`;
            const contactRow = worksheet.addRow(['', contactText]);
            worksheet.mergeCells('B4:I4');
            const cc = worksheet.getCell('B4');
            cc.font = { size: 10, color: { argb: textGray } };
            cc.alignment = { horizontal: 'center', vertical: 'middle' };
            contactRow.height = 20;

            const s5 = worksheet.addRow([]); // Row 5 Spacer
            for (let i = 2; i <= 9; i++) s5.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgLight } };

            // Row 6: Report Title
            const reportTitleRow = worksheet.addRow(['', 'SALES PERFORMANCE REPORT']);
            worksheet.mergeCells('B6:I6');
            const rtCell = worksheet.getCell('B6');
            rtCell.font = { size: 24, bold: true, color: { argb: textDark } };
            rtCell.alignment = { horizontal: 'center' };
            reportTitleRow.height = 35;

            // Row 7: Report Metadata (Generated Time & Period)
            const periodText = `Period: ${dateRange.start} - ${dateRange.end || 'Today'}`;
            const generatedText = `Generated: ${new Date().toLocaleString()}`;
            const metaRow = worksheet.addRow(['', `${generatedText}   |   ${periodText}`]);
            worksheet.mergeCells('B7:I7');
            const mc = worksheet.getCell('B7');
            mc.font = { size: 10, color: { argb: textGray } };
            mc.alignment = { horizontal: 'center' };
            metaRow.height = 20;

            const s8 = worksheet.addRow([]); // Row 8 Spacer
            for (let i = 2; i <= 9; i++) s8.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgLight } };

            // Row 9: Financial Overview Header Block
            const overviewTitleRow = worksheet.addRow(['', 'FINANCIAL OVERVIEW']);
            worksheet.mergeCells('B9:I9');
            const otCell = worksheet.getCell('B9');
            otCell.font = { size: 14, bold: true, color: { argb: textDark } };
            otCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
            otCell.alignment = { horizontal: 'center', vertical: 'middle' };
            overviewTitleRow.height = 30;

            const pdfStatsValue = filteredOrders.reduce((acc, o) => ({ rev: acc.rev + (Number(o.totalAmount) || 0), count: acc.count + 1 }), { rev: 0, count: 0 });
            const monthlyExVal = restaurant?.monthlyExpense || restaurant?.restaurantDetails?.monthlyExpense || 0;
            const daysCountVal = Math.max(1, Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24)));
            const totalExpValue = (monthlyExVal / 30) * daysCountVal;
            const taxAmtVal = pdfStatsValue.rev * 0.05;
            const netProfitVal = pdfStatsValue.rev - totalExpValue - taxAmtVal;

            // Metric Rows - Layout: [Rev (B:C)] [Exp (D)] [Tax (E)] [Profit (F)] [Orders (G:H)] [AOV (I)]
            const statsLRow = worksheet.addRow(['', 'TOTAL REVENUE', '', 'EXPENSES', 'TAX (5%)', 'NET PROFIT', 'TOTAL ORDERS', '', 'AVG VALUE']);
            statsLRow.height = 25;
            worksheet.mergeCells('B10:C10');
            worksheet.mergeCells('G10:H10');

            const statsVRow = worksheet.addRow(['', pdfStatsValue.rev, '', totalExpValue, taxAmtVal, netProfitVal, pdfStatsValue.count, '', pdfStatsValue.count > 0 ? pdfStatsValue.rev / pdfStatsValue.count : 0]);
            statsVRow.height = 50;
            worksheet.mergeCells('B11:C11');
            worksheet.mergeCells('G11:H11');

            // Apply Styles to Stats Block
            [statsLRow, statsVRow].forEach(row => {
                row.eachCell((cell, i) => {
                    if (i > 1) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgLight } };
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.border = { top: { style: 'none' }, left: { style: 'none' }, bottom: { style: 'none' }, right: { style: 'none' } };
                    }
                });
            });

            // Specific Formatting for Values
            // B(2), D(4), E(5), F(6), G(7), I(9)
            [2, 4, 5, 6, 7, 9].forEach(colIndex => {
                const cell = statsVRow.getCell(colIndex);
                cell.font = { size: 16, bold: true, color: { argb: textDark } };
                if (colIndex !== 7) {
                    cell.numFmt = `"₹"#,##0.00`;
                }
                if (colIndex === 6) cell.font.color = { argb: brandOrange };
            });

            const spacer1 = worksheet.addRow([]);
            const spacer2 = worksheet.addRow([]);
            [spacer1, spacer2].forEach(row => {
                for (let i = 2; i <= 9; i++) {
                    row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgLight } };
                    row.getCell(i).border = { top: { style: 'none' }, left: { style: 'none' }, bottom: { style: 'none' }, right: { style: 'none' } };
                }
            });

            // Transaction History Title Row
            const historyTitleRow = worksheet.addRow(['', 'TRANSACTION HISTORY']);
            worksheet.mergeCells(`B${historyTitleRow.number}:I${historyTitleRow.number}`);
            const htCell = worksheet.getCell(`B${historyTitleRow.number}`);
            htCell.font = { size: 14, bold: true, color: { argb: textDark } };
            htCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
            htCell.alignment = { horizontal: 'center', vertical: 'middle' };
            historyTitleRow.height = 30;

            // Table Header
            const tableH = worksheet.addRow(['', 'DATE', 'TIME', 'ORDER ID', 'CUSTOMER', 'PAY MODE', 'ITEMS', 'TAX (5%)', 'TOTAL']);
            tableH.height = 35;
            tableH.eachCell((cell, i) => {
                if (i > 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandOrange } };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = { top: { style: 'none' }, left: { style: 'none' }, bottom: { style: 'none' }, right: { style: 'none' } };
                }
            });

            // Data Rows
            filteredOrders.forEach((o, index) => {
                const row = worksheet.addRow([
                    '',
                    new Date(o.createdAt).toLocaleDateString(),
                    new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    formatOrderDisplayId(o),
                    o.customerInfo?.name || 'Guest',
                    o.paymentMethod || 'Cash',
                    o.items?.length || 0,
                    (o.totalAmount || 0) * 0.05,
                    o.totalAmount || 0
                ]);
                row.height = 25;
                const rowFill = index % 2 === 0 ? 'FFFFFF' : 'F2F2F2';
                row.eachCell((cell, i) => {
                    if (i > 1) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.font = { size: 10, color: { argb: textDark } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
                        cell.border = { top: { style: 'none' }, left: { style: 'none' }, bottom: { style: 'none' }, right: { style: 'none' } };
                        if (i === 8 || i === 9) cell.numFmt = `"₹"#,##0.00`;
                    }
                });
            });

            // Footer Section: Powered By
            worksheet.addRow([]); worksheet.addRow([]); // Spacer rows
            const footerRow = worksheet.addRow(['', 'POWERED BY   ']);
            worksheet.mergeCells(`B${footerRow.number}:I${footerRow.number}`);
            const footCell = worksheet.getCell(`B${footerRow.number}`);
            footCell.font = { size: 10, bold: true, color: { argb: textGray } };
            footCell.alignment = { horizontal: 'center', vertical: 'middle' };
            footerRow.height = 40;

            if (egLogo) {
                const egLogoId = workbook.addImage({ base64: egLogo, extension: 'png' });
                worksheet.addImage(egLogoId, {
                    tl: { col: 5.1, row: footerRow.number - 1 + 0.15 },
                    ext: { width: 100, height: 30 }
                });
            }

            // Ensure white background for footer area
            for (let r = footerRow.number - 2; r <= footerRow.number + 3; r++) {
                const row = worksheet.getRow(r);
                for (let c = 2; c <= 9; c++) {
                    const cell = row.getCell(c);
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
                    cell.border = { top: { style: 'none' }, left: { style: 'none' }, bottom: { style: 'none' }, right: { style: 'none' } };
                }
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Sales_Report_${dateRange.start}.xlsx`;
            a.click();
            toast.success('Excel report downloaded', { id: toastId });
        } catch (error) {
            console.error(error); toast.error('Failed to generate Excel', { id: toastId });
        }
    };

    return (
        <div className="space-y-6 pb-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[20px] sm:text-[24px] lg:text-[28px] font-normal text-black tracking-tight leading-none">Sales Dashboard</h1>
                    <p className="text-[12px] sm:text-[18px] text-gray-400 font-normal">Financial Overview & Analytics</p>
                </div>
                <div className="flex flex-row items-center justify-end gap-2 w-full md:w-auto py-2">
                    <button
                        onClick={() => setIsDatePickerOpen(true)}
                        className="w-full sm:w-auto h-10 sm:h-12 bg-white border border-gray-100 text-gray-700 text-[10px] sm:text-[13px] rounded-full px-4 sm:px-6 outline-none shadow-sm transition-all hover:border-gray-300 flex items-center gap-2 font-normal justify-between sm:justify-start shrink-0"
                    >
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        <span>{dateRange.start ? `${dateRange.start} - ${dateRange.end || 'Today'}` : "Select Date Range"}</span>
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ml-1" />
                    </button>
                    {isDatePickerOpen && <DateRangePicker range={dateRange} onChange={setDateRange} onClose={() => setIsDatePickerOpen(false)} />}

                    <button
                        onClick={handleDownloadPDF}
                        className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-sm text-sm overflow-hidden h-10 w-10 sm:h-12 sm:w-12 sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2 shrink-0"
                    >
                        <Download className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
                            Export PDF
                        </span>
                    </button>

                    <button
                        onClick={handleDownloadExcel}
                        className="bg-green-600 hover:bg-green-700 text-white p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-sm text-sm overflow-hidden h-10 w-10 sm:h-12 sm:w-12 sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2 shrink-0"
                    >
                        <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
                            Export Excel
                        </span>
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <SalesCard title="Total Revenue" value={formatCurrency(stats.revenue, currencySymbol)} icon={DollarSign} />
                <SalesCard title="Net Profit" value={formatCurrency(stats.netProfit, currencySymbol)} subValue="After Expenses & Tax" icon={TrendingUp} />
                <SalesCard title="Avg Order Value" value={formatCurrency(stats.aov, currencySymbol)} icon={Activity} />
                <SalesCard title="Total Orders" value={stats.orders} icon={ShoppingBag} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] shadow-sm">
                    <div className="mb-6"><h3 className="text-[16px] sm:text-[24px] font-normal text-black">Revenue & Net Profit</h3><p className="text-xs text-gray-400">Monthly breakdown</p></div>
                    <div className="h-[220px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f3f3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="totalRevenue" stroke="#FD6941" fill="#FD6941" fillOpacity={0.1} strokeWidth={3} />
                                <Area type="monotone" dataKey="netProfit" stroke="#000000" fill="#000000" fillOpacity={0.05} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-[1.5rem] shadow-sm">
                    <div className="mb-6"><h3 className="text-[16px] sm:text-[24px] font-normal text-black">Total Orders</h3><p className="text-xs text-gray-400">Order volume</p></div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f3f3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="volume" fill="#FD6941" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[1.5rem] shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <h3 className="text-[16px] sm:text-[24px] font-normal text-black">Transaction History</h3>
                        <p className="text-[12px] text-gray-400 font-normal">Detailed list of past orders</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-normal">Order ID</th>
                                <th className="px-6 py-4 font-normal">Date & Time</th>
                                <th className="px-6 py-4 font-normal text-center">Payment</th>
                                <th className="px-6 py-4 font-normal text-center">Items</th>
                                <th className="px-6 py-4 font-normal text-right">Tax (5%)</th>
                                <th className="px-6 py-4 font-normal text-right">Total</th>
                                <th className="px-6 py-4 font-normal text-center">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-normal text-black">{formatOrderDisplayId(order)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-normal ${(order.paymentMethod || 'Cash') === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{order.paymentMethod || 'Cash'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{order.items?.length || 0}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency((order.totalAmount || 0) * 0.05, currencySymbol)}</td>
                                        <td className="px-6 py-4 text-sm font-normal text-black text-right">{formatCurrency(order.totalAmount || 0, currencySymbol)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setSelectedOrder(order)} className="w-8 h-8 rounded-full bg-[#FD6941] text-white flex items-center justify-center mx-auto shadow-md"><FileText size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InvoiceModal order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} currencySymbol={currencySymbol} restaurant={restaurant} />
        </div>
    );
};

export default AdminSales;
