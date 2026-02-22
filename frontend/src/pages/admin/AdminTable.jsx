import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Activity, Eye, User, Clock, UtensilsCrossed, X, Loader2, QrCode, Download, Printer, FileText } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import { restaurantAPI, orderAPI } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import logo from '../../assets/logo-m.svg';
import EatGreetLogo from '../../assets/logo-full.png';

const AdminTable = () => {
    const [tables, setTables] = useState(() => {
        const saved = localStorage.getItem('admin_tables');
        let initialTables = saved ? JSON.parse(saved) : [1, 2, 3, 4, 5];
        // Ensure unique and sorted
        initialTables = [...new Set(initialTables.map(Number))].sort((a, b) => a - b);
        return initialTables;
    });

    const { currencySymbol } = useSettings();

    const [restaurantName, setRestaurantName] = useState('');
    const [activeOrders, setActiveOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true); // intentionally unused, used for possible future loading UI
    const [selectedTableOrder, setSelectedTableOrder] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [qrModal, setQrModal] = useState({ isOpen: false, url: '', tableNo: null });
    const [restaurant, setRestaurant] = useState(null);
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);

    const syncTableCount = async (count, tableList) => {
        try {
            await restaurantAPI.updateDetails({ 
                totalTables: count,
                tableNumbers: tableList?.map(String) // Ensure strings for consistency
            });
        } catch (error) {
            console.error("Failed to sync tables", error);
        }
    };

    const socket = useSocket();

    // Initial Mount
    useEffect(() => {
        const init = async () => {
            try {
                const { data } = await restaurantAPI.getDetails();
                setRestaurant(data);
                setRestaurantName(data.name || 'restaurant');

                const backendTableNumbers = data.restaurantDetails?.tableNumbers || [];
                const backendTableCount = data.restaurantDetails?.totalTables || data.totalTables || 0;

                // Sync with backend as source of truth
                if (backendTableNumbers.length > 0) {
                    setTables(backendTableNumbers.map(Number));
                } else if (backendTableCount > 0) {
                    // Fallback for old data with only totalTables count
                    setTables(Array.from({ length: backendTableCount }, (_, i) => i + 1));
                }
            } catch (err) {
                console.error("Init failed", err);
            }
            fetchActiveOrders();
        };
        init();
    }, []);

    // Handle Table State Changes
    useEffect(() => {
        if (tables.length > 0) {
            localStorage.setItem('admin_tables', JSON.stringify(tables));
            syncTableCount(tables.length, tables);
        }
    }, [tables]);

    // Socket Listener for Real-Time Table Status
    useEffect(() => {
        if (!socket || !restaurantName) return;

        socket.emit('joinRestaurant', restaurantName);

        const handleOrderUpdate = () => {
            console.log("Real-time table status update received");
            fetchActiveOrders();
        };

        socket.on('orderUpdated', handleOrderUpdate);
        return () => socket.off('orderUpdated');
    }, [socket, restaurantName]);

    // Keep selectedTableOrder updated if activeOrders changes while modal is open
    useEffect(() => {
        if (isPreviewOpen && selectedTableOrder) {
            const updated = activeOrders.find(o => String(o.tableNumber) === String(selectedTableOrder.tableNumber));
            if (updated) {
                setSelectedTableOrder(updated);
            } else {
                // Order might have been completed/cancelled
                setIsPreviewOpen(false);
            }
        }
    }, [activeOrders, isPreviewOpen, selectedTableOrder]);

    const fetchActiveOrders = async () => {
        try {
            const { data } = await orderAPI.getOrders();
            // Filter for active orders only
            const active = (data || []).filter(o => ['pending', 'preparing', 'ready', 'served'].includes(o.status));
            setActiveOrders(active);
        } catch (error) {
            console.error("Failed to fetch active orders", error);
        } finally {
            setLoadingOrders(false);
        }
    };


    const addTable = () => {
        const numericTables = tables.map(Number);
        const nextTableNo = numericTables.length > 0 ? Math.max(...numericTables) + 1 : 1;

        // Ensure unique and sorted
        const newTables = [...new Set([...numericTables, nextTableNo])].sort((a, b) => a - b);
        setTables(newTables);
        toast.success(`Table ${nextTableNo} added`);
    };

    const removeTable = (table) => {
        const newTables = tables.filter(t => t !== table);
        setTables(newTables);
        toast.success(`Table ${table} removed`);
    };

    const getTableUrl = (tableNo) => {
        // Sanitize restaurant name for URL safe string if it has spaces? 
        // For now assume user knows or simple replace. 
        // Ideally backend enforces slug. Let's do simple encoding or replacement.
        const slug = restaurantName.toLowerCase().trim().replace(/\s+/g, '-');
        return `${window.location.origin}/${slug}/table/${tableNo}`;
    };

    const handlePrint = (order) => {
        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;

            const orderStats = (() => {
                const subtotal = order.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0;
                const cgst = subtotal * 0.025;
                const sgst = subtotal * 0.025;
                const totalRaw = subtotal + cgst + sgst;
                const grandTotal = Math.round(totalRaw);
                const roundOff = grandTotal - totalRaw;
                return { subtotal, cgst, sgst, totalRaw, grandTotal, roundOff };
            })();

            const itemsRows = (order.items || []).map((it, i) => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                    <div style="flex: 1;">${i + 1}. ${it.name}</div>
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
                    ${restaurant?.logo ? `<img src="${restaurant.logo}" style="height: 55px; width: auto; margin-bottom: 10px; object-contain" />` : ''}
                    <div class="restaurant-name">${restaurant?.name || 'EatGreet Restaurant'}</div>
                    <div class="restaurant-info font-normal" style="margin-top: 5px; font-style: italic;">${restaurant?.address || restaurant?.restaurantDetails?.address || 'Restaurant Address'}</div>
                        ${(restaurant?.businessEmail || restaurant?.restaurantDetails?.businessEmail) ? `<div class="restaurant-info">Email: ${restaurant.businessEmail || restaurant.restaurantDetails.businessEmail}</div>` : ''}
                        ${(restaurant?.gstNumber || restaurant?.restaurantDetails?.gstNumber) ? `<div class="restaurant-info">GST: ${restaurant.gstNumber || restaurant.restaurantDetails.gstNumber}</div>` : ''}
                        ${(restaurant?.contactNumber || restaurant?.restaurantDetails?.contactNumber) ? `<div class="restaurant-info" style="margin-top: 2px;">Tel: ${restaurant.contactNumber || restaurant.restaurantDetails.contactNumber}</div>` : ''}
                    </div>

                    <div class="divider"></div>
                    <div class="info-row"><span>Name:</span> <span>${order.customerInfo?.name || 'Guest'}</span></div>
                    ${order.customerInfo?.phone ? `<div class="info-row"><span>Tel:</span> <span>${order.customerInfo.phone}</span></div>` : ''}
                    <div class="divider"></div>
                    
                    <div class="info-row">
                        <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>Table: ${order.tableNumber || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="info-row">
                        <span>Cashier: Admin</span>
                        <span>Bill No: ${order.dailySequence ? String(order.dailySequence).padStart(3, '0') : order._id.slice(-4)}</span>
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
                    <div class="info-row" style="font-size: 18px; font-weight: bold;">
                        <span>Grand Total</span>
                        <span>${currencySymbol}${orderStats.grandTotal.toFixed(2)}</span>
                    </div>
                    <div class="divider"></div>
                    
                    <div class="footer">THANK YOU VISIT AGAIN</div>
                </body>
                <script>
                    window.onload = () => { window.print(); window.close(); }
                </script>
            `;

            printWindow.document.write(html);
            printWindow.document.close();
        } catch (error) {
            console.error("Print error", error);
        }
    };

    const handleCompleteOrder = async (order) => {
        const loadToast = toast.loading('Completing order...');
        try {
            await orderAPI.updateStatus(order._id, 'completed');
            toast.success('Order completed!', { id: loadToast });
            setIsPreviewOpen(false);
            fetchActiveOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete order', { id: loadToast });
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <h1 className="text-[20px] sm:text-[24px] lg:text-[30px] font-normal text-black tracking-tight leading-none">Table Management</h1>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={addTable}
                        className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white h-10 sm:h-12 px-4 sm:px-6 rounded-full font-normal flex items-center justify-center gap-2 transition-all duration-300 shadow-sm text-sm"
                    >
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        <span className="hidden sm:block">
                            Add Table
                        </span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
                {tables.map(table => {
                    const url = getTableUrl(table);
                    const tableOrder = activeOrders.find(o => String(o.tableNumber) === String(table));
                    const isLive = !!tableOrder;

                    return (
                        <div key={table}
                            className={`bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-5 aspect-square shadow-sm border-2 transition-all group relative flex flex-col items-center justify-center text-center overflow-hidden
                                ${isLive ? 'border-[#FD6941] bg-orange-50/30' : 'border-gray-100 hover:border-gray-200'}
                            `}
                        >
                            {/* Top Actions Bar - Delete only on Right */}
                            <div className="absolute top-3 right-3 sm:top-5 sm:right-5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                                <button
                                    onClick={() => removeTable(table)}
                                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-white text-gray-300 hover:text-red-500 rounded-md sm:rounded-lg shadow-sm border border-gray-100 transition-colors"
                                    title="Delete Table"
                                >
                                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                            </div>

                            {/* Center Content */}
                            <div className="flex flex-col items-center mb-8 sm:mb-10">
                                <span className={`text-3xl md:text-5xl font-normal mb-1 tracking-tighter  transition-colors duration-500 ${isLive ? 'text-[#FD6941]' : 'text-gray-900'}`}>
                                    {table}
                                </span>
                                <div className={`px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-normal uppercase tracking-[0.2em] shadow-sm border transition-all duration-500
                                    ${isLive
                                        ? 'bg-[#FD6941] text-white border-[#FD6941] '
                                        : 'bg-gray-50 text-gray-400 border-gray-100'}
                                `}>
                                    {isLive ? 'Occupied' : 'Vacant'}
                                </div>
                            </div>

                            {/* Bottom Actions Bar (Brand Styled - Clean Dock) */}
                            <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 flex justify-center items-center gap-1 sm:gap-2 px-2">
                                <button
                                    onClick={() => {
                                        if (isLive) {
                                            toast.error("You can't order here, this table is already occupied. Please check your table number and scan the QR Code again.", { duration: 4000 });
                                            return;
                                        }
                                        setQrModal({ isOpen: true, url, tableNo: table });
                                    }}
                                    className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl bg-white text-gray-400 hover:text-blue-600 transition-all border border-gray-100 hover:border-blue-100 shadow-sm group/icon"
                                    title="Scan QR"
                                >
                                    <QrCode className="w-3 h-3 md:w-4 md:h-4 group-hover/icon:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (isLive) {
                                            setSelectedTableOrder(tableOrder);
                                            setIsPreviewOpen(true);
                                        }
                                    }}
                                    disabled={!isLive}
                                    className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl transition-all border shadow-sm group/icon
                                        ${isLive
                                            ? 'bg-[#FD6941] text-white border-[#FD6941]/20 hover:scale-110 active:scale-95'
                                            : 'bg-gray-50/50 text-gray-200 border-gray-100 cursor-not-allowed'}
                                    `}
                                    title="Preview Order"
                                >
                                    <Eye className="w-3 h-3 md:w-4 md:h-4 group-hover/icon:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (isLive) {
                                            setInvoiceOrder(tableOrder);
                                            setIsInvoicePreviewOpen(true);
                                        }
                                    }}
                                    disabled={!isLive}
                                    className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl transition-all border shadow-sm group/icon
                                        ${isLive
                                            ? 'bg-[#FD6941] text-white border-[#FD6941]/20 hover:scale-110 active:scale-95'
                                            : 'bg-gray-50/50 text-gray-200 border-gray-100 cursor-not-allowed'}
                                    `}
                                    title="Invoice"
                                >
                                    <FileText className="w-3 h-3 md:w-4 md:h-4 group-hover/icon:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Order Preview Modal */}
            {
                isPreviewOpen && selectedTableOrder && createPortal(
                    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Premium Modal Header */}
                            <div className="relative p-6 md:p-8 pb-4 text-center">
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="absolute right-4 md:right-8 top-4 md:top-8 w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
                                >
                                    <X className="w-4 h-4 md:w-5 md:h-5" />
                                </button>

                                <h2 className="text-3xl md:text-4xl font-normal  text-gray-900 tracking-tighter mt-4 md:mt-4">Table {selectedTableOrder.tableNumber}</h2>
                                <p className="text-gray-400 text-[10px] font-normal uppercase tracking-[0.3em] mt-2">Live Order View</p>
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                {/* Customer Card - Cleaner */}
                                <div className="flex items-center gap-4 p-5 bg-gray-50/80 rounded-[2.5rem] border border-gray-100">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-400 text-[9px] font-normal uppercase tracking-wider mb-0.5">Ordering Person</p>
                                        <p className="text-lg font-normal text-gray-900  leading-tight">{selectedTableOrder.customerInfo?.name || 'Guest User'}</p>
                                    </div>
                                </div>

                                {/* Order Items List */}
                                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedTableOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 group hover:border-[#FD6941] transition-all">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#FD6941] font-normal text-sm">
                                                    {item.quantity}x
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-normal text-gray-900 truncate">{item.name}</p>
                                                    <p className={`text-[10px] font-normal uppercase ${item.status === 'ready' ? 'text-green-500' : 'text-gray-400'}`}>
                                                        {item.status || 'Pending'}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-normal text-gray-900 ">{currencySymbol}{item.price}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Amount Section - LIGHT THEME */}
                                <div className="p-6 md:p-8 bg-gray-50 rounded-2xl md:rounded-[3rem] text-gray-900 flex justify-between items-center border border-gray-100 relative overflow-hidden group shadow-sm">
                                    <div className="relative z-10">
                                        <p className="text-[11px] text-gray-400 font-normal uppercase tracking-[0.1em] mb-1.5">Grand Total Amount</p>
                                        <p className="text-3xl sm:text-5xl font-normal  tracking-tighter">
                                            {currencySymbol}{selectedTableOrder.totalAmount?.toFixed(2) || (selectedTableOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) * 1.05).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                                        <span className="text-2xl md:text-3xl text-gray-300 font-light ">#</span>
                                    </div>
                                    {/* Subtle Ambient Glow */}
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FD6941]/30 blur-[60px] rounded-full" />
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleCompleteOrder(selectedTableOrder)}
                                    className={`w-full py-4 md:py-5 rounded-2xl md:rounded-[2.5rem] font-normal uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center shadow-xl
                                        ${(selectedTableOrder.items?.some(it => ['ready', 'served'].includes(it.status)) || selectedTableOrder.status === 'ready')
                                            ? 'bg-[#FD6941] text-white hover:bg-[#FD6941] hover:scale-[1.02] '
                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                                    `}
                                >
                                    Finish & Settle Order
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* QR Code Modal */}
            {
                qrModal.isOpen && createPortal(
                <div className="fixed inset-0 w-full h-[100dvh] z-[99999] bg-black/60 backdrop-blur-xl flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="fixed inset-0" onClick={() => setQrModal({ ...qrModal, isOpen: false })} />
                    <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in duration-200 relative z-10">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-normal text-gray-800">Table {qrModal.tableNo} QR Code</h2>
                                <button
                                    onClick={() => setQrModal({ ...qrModal, isOpen: false })}
                                    className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 flex flex-col items-center">
                                <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-6" id="qr-container">
                                    <QRCodeCanvas
                                        id={`qr-canvas-${qrModal.tableNo}`}
                                        value={qrModal.url}
                                        size={250}
                                        level="H"
                                        includeMargin={true}
                                        imageSettings={{
                                            src: logo,
                                            x: undefined,
                                            y: undefined,
                                            height: 50,
                                            width: 50,
                                            excavate: true,
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const canvas = document.getElementById(`qr-canvas-${qrModal.tableNo}`);
                                        const url = canvas.toDataURL("image/png");
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `Table_${qrModal.tableNo}_QR.png`;
                                        link.click();
                                        toast.success('QR Code downloaded');
                                    }}
                                    className="w-full bg-[#FD6941] text-white py-4 rounded-2xl font-normal flex items-center justify-center gap-2 hover:bg-[#FD6941] transition-all shadow-lg  active:scale-[0.98]"
                                >
                                    <Download className="w-5 h-5" /> Download QR Code
                                </button>
                                <p className="mt-4 text-[10px] text-gray-400 text-center uppercase font-normal tracking-widest">
                                    Scan this to open Table {qrModal.tableNo} menu
                                </p>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Invoice Preview Modal - Standardized UI */}
            {isInvoicePreviewOpen && invoiceOrder && createPortal(
                <div className="fixed inset-0 w-full h-[100dvh] z-[99999] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
                    <div className="fixed inset-0" onClick={() => setIsInvoicePreviewOpen(false)} />
                    <div className="bg-gradient-to-br from-gray-50 to-white w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in duration-300">

                        <button
                            onClick={() => setIsInvoicePreviewOpen(false)}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-md shadow-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all z-[60] border border-gray-100"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="p-2 sm:p-8 overflow-y-auto custom-scrollbar flex items-start sm:items-center justify-center bg-gray-100/50 h-full flex-1">
                            <div className="bg-white mx-auto shadow-sm border border-gray-200 p-4 sm:p-8 font-mono text-black relative my-2 sm:my-8" style={{ width: '100%', maxWidth: '380px' }}>
                                <button
                                    onClick={() => handlePrint(invoiceOrder)}
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
                                    <span className="font-normal">{invoiceOrder.customerInfo?.name || 'Guest'}</span>
                                </div>
                                {invoiceOrder.customerInfo?.phone && (
                                    <div className="flex justify-between text-[13px] mb-1">
                                        <span>Tel:</span>
                                        <span className="font-normal">{invoiceOrder.customerInfo.phone}</span>
                                    </div>
                                )}
                                <div className="border-t border-dashed border-black my-4"></div>

                                <div className="flex justify-between text-[13px] mb-1">
                                    <span>Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</span>
                                    <span>Table: {invoiceOrder.tableNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-[13px] mb-1">
                                    <span>Time: {new Date(invoiceOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex justify-between text-[13px] mb-1">
                                    <span>Cashier: Admin</span>
                                    <span>Bill No: {invoiceOrder.dailySequence ? String(invoiceOrder.dailySequence).padStart(3, '0') : invoiceOrder._id.slice(-4)}</span>
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
                                    {(invoiceOrder.items || []).map((it, i) => (
                                        <div key={i} className="flex justify-between text-[13px]">
                                            <span style={{ flex: 1 }}>{i + 1}.{it.name}</span>
                                            <span style={{ width: '30px', textAlign: 'center' }}>{it.quantity || 1}</span>
                                            <span style={{ width: '60px', textAlign: 'right' }}>{(it.price || 0).toFixed(2)}</span>
                                            <span style={{ width: '70px', textAlign: 'right' }}>{(it.price * (it.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-dashed border-black my-4"></div>
                                {(() => {
                                    const subtotal = invoiceOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0;
                                    const cgst = subtotal * 0.025;
                                    const sgst = subtotal * 0.025;
                                    const totalRaw = subtotal + cgst + sgst;
                                    const grandTotal = Math.round(totalRaw);
                                    const roundOff = grandTotal - totalRaw;

                                    return (
                                        <>
                                            <div className="flex justify-between font-normal text-[13px] mb-1">
                                                <span>Total Qty: {invoiceOrder.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}</span>
                                                <span>Sub Total: {currencySymbol}{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>CGST@2.5%</span>
                                                <span>{currencySymbol}{cgst.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>SGST@2.5%</span>
                                                <span>{currencySymbol}{sgst.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-normal text-[13px] mb-1">
                                                <span>Total</span>
                                                <span>{currencySymbol}{totalRaw.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>Round Off</span>
                                                <span>{currencySymbol}{roundOff.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-dashed border-black my-4"></div>
                                            <div className="flex justify-between font-normal text-lg mb-4">
                                                <span>Grand Total</span>
                                                <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )
                                })()}
                                <div className="border-t border-dashed border-black my-4"></div>
                                <div className="text-center font-normal text-[16px] uppercase tracking-widest mt-6">THANK YOU VISIT AGAIN</div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {
                tables.length === 0 && (
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 min-h-[300px] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">🪑</span>
                        </div>
                        <h3 className="text-lg font-normal text-gray-800 mb-1">No Tables Added</h3>
                        <p className="text-gray-400 text-sm max-w-sm">
                            Add tables to generate unique menu links for your customers.
                        </p>
                    </div>
                )
            }
        </div >
    );
};

export default AdminTable;
