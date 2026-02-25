import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Activity, Eye, User, Clock, UtensilsCrossed, X, Loader2, QrCode, Download, Printer, FileText, Hash } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import { restaurantAPI, orderAPI } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import logo from '../../assets/logo-m.svg';
import EatGreetLogo from '../../assets/logo-full.png';

const TableIcon = ({ className, style }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className={className}
        style={style}
    >
        <path
            fill="currentColor"
            d="M6.375 19.05 7.5 16.25c0.15 -0.38335 0.39165 -0.6875 0.725 -0.9125 0.33335 -0.225 0.70835 -0.3375 1.125 -0.3375h1.9v-4.025c-2.65 -0.08335 -4.85415 -0.45835 -6.6125 -1.125C2.879165 9.18335 2 8.4 2 7.5c0 -0.96665 0.975 -1.79165 2.925 -2.475C6.875 4.341665 9.23335 4 12 4c2.76665 0 5.125 0.341665 7.075 1.025C21.025 5.70835 22 6.53335 22 7.5c0 0.9 -0.87915 1.68335 -2.6375 2.35 -1.75835 0.66665 -3.9625 1.04165 -6.6125 1.125V15h1.9c0.4 0 0.77085 0.1125 1.1125 0.3375 0.34165 0.225 0.5875 0.52915 0.7375 0.9125l1.125 2.8c0.08335 0.23335 0.05835 0.45 -0.075 0.65s-0.325 0.3 -0.575 0.3c-0.13335 0 -0.2625 -0.04165 -0.3875 -0.125 -0.125 -0.08335 -0.2125 -0.19165 -0.2625 -0.325l-1.2 -3.05H8.9l-1.225 3.075c-0.05 0.13335 -0.1375 0.2375 -0.2625 0.3125 -0.125 0.075 -0.25415 0.1125 -0.3875 0.1125 -0.25 0 -0.44165 -0.1 -0.575 -0.3 -0.13335 -0.2 -0.15835 -0.41665 -0.075 -0.65ZM12 9.5c1.8 0 3.48335 -0.18335 5.05 -0.55 1.56665 -0.36665 2.75835 -0.85 3.575 -1.45 -0.81665 -0.6 -2.00835 -1.08335 -3.575 -1.45 -1.56665 -0.36665 -3.25 -0.55 -5.05 -0.55 -1.8 0 -3.48335 0.18335 -5.05 0.55 -1.56665 0.36665 -2.758335 0.85 -3.575 1.45 0.816665 0.6 2.00835 1.08335 3.575 1.45 1.56665 0.36665 3.25 0.55 5.05 0.55Z"
        />
    </svg>
);

const UserIcon = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} style={style}>
        <path fill="currentColor" d="M12 11.9751c-1.1 0 -2 -0.35 -2.7 -1.05 -0.7 -0.7 -1.05 -1.6 -1.05 -2.7s0.35 -2 1.05 -2.7c0.7 -0.7 1.6 -1.05 2.7 -1.05s2 0.35 2.7 1.05c0.7 0.7 1.05 1.6 1.05 2.7s-0.35 2 -1.05 2.7c-0.7 0.7 -1.6 1.05 -2.7 1.05Zm-8 6.525v-0.85c0 -0.63335 0.158335 -1.175 0.475 -1.625 0.316665 -0.45 0.725 -0.79165 1.225 -1.025 1.11665 -0.5 2.1875 -0.875 3.2125 -1.125s2.05415 -0.375 3.0875 -0.375 2.05835 0.12915 3.075 0.3875c1.01665 0.25835 2.08265 0.63075 3.198 1.11725 0.52165 0.2355 0.9399 0.5769 1.25475 1.02425 0.31485 0.44735 0.47225 0.98765 0.47225 1.621v0.85c0 0.4125 -0.14685 0.7656 -0.4405 1.05925 -0.29385 0.29385 -0.647 0.44075 -1.0595 0.44075H5.5c-0.4125 0 -0.765585 -0.1469 -1.05925 -0.44075C4.146915 19.2657 4 18.9126 4 18.5001Zm1.5 0h13v-0.85c0 -0.26665 -0.07915 -0.52085 -0.2375 -0.7625 -0.15835 -0.24165 -0.35415 -0.42085 -0.5875 -0.5375 -1.06665 -0.51665 -2.04165 -0.87085 -2.925 -1.0625 -0.88335 -0.19165 -1.8 -0.2875 -2.75 -0.2875s-1.875 0.09585 -2.775 0.2875c-0.9 0.19165 -1.875 0.54585 -2.925 1.0625 -0.23335 0.11665 -0.425 0.29585 -0.575 0.5375 -0.15 0.24165 -0.225 0.49585 -0.225 0.7625v0.85Zm6.5 -8.025c0.65 0 1.1875 -0.2125 1.6125 -0.6375 0.425 -0.425 0.6375 -0.9625 0.6375 -1.6125s-0.2125 -1.1875 -0.6375 -1.6125c-0.425 -0.425 -0.9625 -0.6375 -1.6125 -0.6375s-1.1875 0.2125 -1.6125 0.6375c-0.425 0.425 -0.6375 0.9625 -0.6375 1.6125s0.2125 1.1875 0.6375 1.6125c0.425 0.425 0.9625 0.6375 1.6125 0.6375Z" />
    </svg>
);

const ChecklistIcon = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} style={style}>
        <path fill="currentColor" d="m5.55 16.52495 3.95 -3.95c0.15 -0.15 0.325 -0.2208 0.525 -0.2125 0.2 0.00835 0.37825 0.0875 0.53475 0.2375 0.1435 0.15 0.21525 0.325 0.21525 0.525s-0.075 0.375 -0.225 0.525l-4.475 4.475c-0.15 0.15 -0.325 0.225 -0.525 0.225s-0.375 -0.075 -0.525 -0.225l-2.50001 -2.5c-0.15 -0.15 -0.225 -0.325 -0.225 -0.525s0.075 -0.375 0.225 -0.525c0.15 -0.15 0.325 -0.2208 0.525 -0.2125 0.2 0.00835 0.375 0.0792 0.525 0.2125l1.97501 1.95Zm0 -8L9.5 4.574975c0.15 -0.15 0.325 -0.220835 0.525 -0.2125 0.2 0.008335 0.37825 0.0875 0.53475 0.2375 0.1435 0.15 0.21525 0.325 0.21525 0.524975 0 0.2 -0.075 0.375 -0.225 0.525l-4.475 4.475c-0.15 0.15 -0.325 0.225 -0.525 0.225s-0.375 -0.075 -0.525 -0.225l-2.50001 -2.5c-0.15 -0.15 -0.225 -0.325 -0.225 -0.525s0.075 -0.375 0.225 -0.525c0.15 -0.15 0.325 -0.2208 0.525 -0.2125 0.2 0.00835 0.375 0.0792 0.525 0.2125l1.97501 1.95Zm8.2 8.225c-0.2125 0 -0.3906 -0.0723 -0.53425 -0.217 -0.14385 -0.1445 -0.21575 -0.32365 -0.21575 -0.5375 0 -0.21365 0.0719 -0.3913 0.21575 -0.533 0.14365 -0.14165 0.32175 -0.2125 0.53425 -0.2125h7.5c0.2125 0 0.39065 0.07235 0.5345 0.217 0.14365 0.1445 0.2155 0.3237 0.2155 0.5375 0 0.2137 -0.07185 0.39135 -0.2155 0.533 -0.14385 0.1417 -0.322 0.2125 -0.5345 0.2125h-7.5Zm0 -8c-0.2125 0 -0.3906 -0.0723 -0.53425 -0.217 -0.14385 -0.1445 -0.21575 -0.32365 -0.21575 -0.5375 0 -0.21365 0.0719 -0.3913 0.21575 -0.533 0.14365 -0.14165 0.32175 -0.2125 0.53425 -0.2125h7.5c0.2125 0 0.39065 0.07235 0.5345 0.217 0.14365 0.1445 0.2155 0.3237 0.2155 0.5375 0 0.2137 -0.07185 0.39135 -0.2155 0.533 -0.14385 0.1417 -0.322 0.2125 -0.5345 0.2125h-7.5Z" />
    </svg>
);
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
                        className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-sm text-sm overflow-hidden h-10 w-10 sm:h-12 sm:w-12 sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2"
                    >
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        <span className="max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
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
                                ${isLive ? 'border-[#FD6941] bg-[#FD6941]/5' : 'border-gray-100 hover:border-gray-200'}
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
                                        ? 'bg-[#FD6941]/10 text-[#FD6941] border-[#FD6941]/30 '
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
                    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Premium Modal Header */}
                            <div className="relative p-6 md:p-8 pb-4 text-center">
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="absolute right-4 md:right-8 top-4 md:top-8 w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
                                >
                                    <X className="w-4 h-4 md:w-5 md:h-5" />
                                </button>

                                <div className="flex items-center justify-center gap-2 mt-4 md:mt-4">
                                    <TableIcon className="w-6 h-6 md:w-8 md:h-8 text-[#FD6941]" />
                                    <h2 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tighter">Table {selectedTableOrder.tableNumber}</h2>
                                </div>
                                <p className="text-gray-400 text-[10px] font-normal uppercase tracking-[0.3em] mt-2">Live Order View</p>
                            </div>

                            <div className="p-6 md:p-8 space-y-6">
                                {/* Customer Card - Cleaner */}
                                <div className="flex items-center gap-4 p-5 bg-gray-50/80 rounded-[2.5rem] border border-gray-100">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                                        <UserIcon className="w-6 h-6" />
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
                                <div
                                    className="p-5 sm:p-6 rounded-[1.2rem] sm:rounded-[2rem] text-gray-900 flex justify-between items-center border border-gray-100 relative overflow-hidden group shadow-sm isolate"
                                    style={{
                                        background: 'radial-gradient(circle at bottom right, rgba(253, 105, 65, 0.08), transparent 70%), #F9FAFB',
                                        transform: 'translateZ(0)'
                                    }}
                                >
                                    <div className="relative z-10">
                                        <p className="text-[9px] sm:text-[11px] text-gray-400 font-normal uppercase tracking-[0.1em] mb-1 sm:mb-1.5">Grand Total Amount</p>
                                        <p className="text-2xl sm:text-4xl font-normal tracking-tighter">
                                            {currencySymbol}{selectedTableOrder.totalAmount?.toFixed(2) || (selectedTableOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) * 1.05).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm transition-transform group-hover:rotate-12">
                                        <Hash className="w-4 h-4 sm:w-6 sm:h-6 text-gray-300 font-light" />
                                    </div>
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
                    <div className="fixed inset-0 w-full h-[100dvh] z-[99999] bg-black/40 backdrop-blur-xl flex items-end sm:items-center justify-center p-2 sm:p-4">
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
                <div className="fixed inset-0 w-full h-[100dvh] z-[99999] bg-black/40 backdrop-blur-xl flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
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
                                    {restaurant?.logo && (
                                        <img src={restaurant.logo} alt="Restaurant Logo" className="h-14 mx-auto mb-2 object-contain" />
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
                                <div className="text-center font-normal text-[13px] uppercase tracking-widest mt-4 mb-1">THANK YOU VISIT AGAIN</div>
                                <div className="flex flex-col items-center mt-4">
                                    <img src={EatGreetLogo} alt="Powered by EatGreet" className="h-8 opacity-40 mb-1" style={{ filter: 'grayscale(1)' }} />
                                    <span className="text-[10px] text-gray-400">Powered by EatGreet</span>
                                </div>
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
}

export default AdminTable;
