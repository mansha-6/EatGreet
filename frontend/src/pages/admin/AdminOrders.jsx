// import { useState, useEffect } from 'react';
// import { createPortal } from 'react-dom';
// import { Clock, Loader2, UtensilsCrossed, X, ChevronLeft, ChevronRight, Printer, FileText, User, Calendar, Hash, ChevronDown } from 'lucide-react';
// import { useSettings } from '../../context/SettingsContext';
// import PropTypes from 'prop-types';
// import clockIcon from '../../assets/clock.svg';
// import chefHatIcon from '../../assets/Chef-Toque-Hat--Streamline-Flex.svg';
// import bellIcon from '../../assets/Bell--Streamline-Flex.svg';
// import diningIcon from '../../assets/Dining-Room--Streamline-Atlas.svg';
// import userIcon from '../../assets/User--Streamline-Font-Awesome.svg';
// import groupIcon from '../../assets/Group--Streamline-Sharp-Material.svg';
// import { orderAPI, statsAPI } from '../../utils/api';
// import toast from 'react-hot-toast';

// const StatCard = ({ icon: Icon, value, title }) => (
//     <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
//         <div className="flex items-start gap-4">
//             <div className="p-3 bg-gray-50 rounded-full">
//                 <Icon className="w-6 h-6 text-gray-700" />
//             </div>
//             <div>
//                 <h3 className="text-4xl font-normal text-gray-800">{value}</h3>
//             </div>
//         </div>
//         <p className="text-gray-500 font-normal ml-1">{title}</p>
//     </div>
// );

// StatCard.propTypes = {
//     icon: PropTypes.elementType.isRequired,
//     value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
//     title: PropTypes.string.isRequired,
// };

// const AdminOrders = () => {
//     const [orders, setOrders] = useState([]);
//     const [stats, setStats] = useState({
//         total: 0,
//         pending: 0,
//         preparing: 0,
//         ready: 0,
//         completed: 0
//     });
//     const [loading, setLoading] = useState(true);
//     const { currencySymbol } = useSettings();
//     const [selectedOrder, setSelectedOrder] = useState(null);
//     const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
//     const [timers, setTimers] = useState({});
//     const [restaurant, setRestaurant] = useState(null);
//     const [historyFilter, setHistoryFilter] = useState('Today');

//     const fetchRestaurantDetails = async () => {
//         try {
//             const { restaurantAPI } = await import('../../utils/api');
//             const { data } = await restaurantAPI.getDetails();
//             setRestaurant(data);
//         } catch (error) {
//             console.error('Failed to fetch restaurant details', error);
//         }
//     };

//     useEffect(() => {
//         fetchRestaurantDetails();
//     }, []);

//     const fetchOrders = async () => {
//         try {
//             const { data } = await orderAPI.getOrders();
//             setOrders(data || []);

//             // Calculate stats from orders
//             const newStats = {
//                 total: data.length,
//                 pending: data.filter(o => o.status === 'pending').length,
//                 preparing: data.filter(o => o.status === 'preparing').length,
//                 ready: data.filter(o => o.status === 'ready').length,
//                 completed: data.filter(o => o.status === 'completed').length
//             };
//             setStats(newStats);
//         } catch (error) {
//             console.error('Failed to fetch orders', error);
//             // toast.error('Failed to update orders');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchOrders();
//         // Poll for updates every 30 seconds
//         const interval = setInterval(fetchOrders, 30000);
//         return () => clearInterval(interval);
//     }, []);

//     // Timer effect for order preparation time
//     useEffect(() => {
//         const timer = setInterval(() => {
//             setTimers(prev => {
//                 const updated = { ...prev };
//                 Object.keys(updated).forEach(orderId => {
//                     if (updated[orderId] > 0) {
//                         updated[orderId]--;
//                     }
//                 });
//                 return updated;
//             });
//         }, 1000);
//         return () => clearInterval(timer);
//     }, []);

//     // Initialize timers for orders
//     useEffect(() => {
//         activeOrders.forEach(order => {
//             if (!timers[order._id]) {
//                 // Calculate time elapsed
//                 const createdAt = new Date(order.createdAt);
//                 const now = new Date();
//                 const elapsedSeconds = Math.floor((now - createdAt) / 1000);
//                 const estimatedTime = 900; // 15 minutes default
//                 const remainingTime = Math.max(0, estimatedTime - elapsedSeconds);
//                 setTimers(prev => ({ ...prev, [order._id]: remainingTime }));
//             }
//         });
//     }, [orders]);

//     const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

//     // Calculate completion percentage
//     const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

//     const formatTime = (seconds) => {
//         const mins = Math.floor(seconds / 60);
//         const secs = seconds % 60;
//         return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//     };

//     const getOrderTime = (createdAt) => {
//         if (!createdAt) return 'N/A';
//         const date = new Date(createdAt);
//         return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
//     };

//     const getStatusColor = (status) => {
//         switch (status) {
//             case 'pending': return 'bg-red-100 text-red-600';
//             case 'preparing': return 'bg-yellow-100 text-yellow-600';
//             case 'ready': return 'bg-green-100 text-green-600';
//             default: return 'bg-gray-100 text-gray-600';
//         }
//     };

//     const getStatusButtonColor = (status) => {
//         switch (status) {
//             case 'pending': return 'bg-[#FD6941] hover:bg-[#FD6941]';
//             case 'preparing': return 'bg-yellow-500 hover:bg-yellow-600';
//             case 'ready': return 'bg-green-500 hover:bg-green-600';
//             default: return 'bg-gray-500 hover:bg-gray-600';
//         }
//     };

//     const getNextStatusLabel = (status) => {
//         switch (status) {
//             case 'pending': return 'Mark Preparing';
//             case 'preparing': return 'Mark Ready';
//             case 'ready': return 'Mark Complete';
//             default: return 'Update';
//         }
//     };

//     const getNextStatus = (status) => {
//         switch (status) {
//             case 'pending': return 'preparing';
//             case 'preparing': return 'ready';
//             case 'ready': return 'completed';
//             default: return status;
//         }
//     };

//     const updateOrderStatus = async (orderId, newStatus) => {
//         const loadToast = toast.loading('Updating order status...');
//         try {
//             await orderAPI.updateStatus(orderId, newStatus);
//             toast.success('Order status updated!', { id: loadToast });
//             fetchOrders();
//         } catch (error) {
//             toast.error(error.response?.data?.message || 'Failed to update status', { id: loadToast });
//         }
//     };

//     const handlePrint = (order) => {
//         try {
//             const printWindow = window.open('', '_blank');
//             if (!printWindow) return;

//             const subtotal = order.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0;
//             const cgst = subtotal * 0.025;
//             const sgst = subtotal * 0.025;
//             const grandTotal = subtotal + cgst + sgst;

//             const itemsRows = (order.items || []).map(it => `
//                 <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
//                     <div style="flex: 1;">${it.name}</div>
//                     <div style="width: 30px; text-align: center;">${it.quantity || 1}</div>
//                     <div style="width: 60px; text-align: right;">${currencySymbol}${(it.price || 0).toFixed(2)}</div>
//                     <div style="width: 70px; text-align: right;">${currencySymbol}${(it.price * (it.quantity || 1)).toFixed(2)}</div>
//                 </div>
//             `).join('');

//             const html = `
//                 <!doctype html>
//                 <html>
//                 <head>
//                     <meta charset="utf-8">
//                     <title>Invoice</title>
//                     <style>
//                         @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
//                         body { 
//                             font-family: 'Courier Prime', monospace; 
//                             color: #000; 
//                             width: 300px; 
//                             margin: 0 auto; 
//                             padding: 20px;
//                         }
//                         .header { text-align: center; margin-bottom: 20px; }
//                         .restaurant-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
//                         .restaurant-info { font-size: 12px; margin-bottom: 2px; }
//                         .divider { border-top: 1px dashed #000; margin: 10px 0; }
//                         .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px; }
//                         .table-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
//                         .footer { text-align: center; margin-top: 20px; font-size: 14px; font-weight: bold; }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="header">
//                         <div class="restaurant-name">${restaurant?.name || 'EatGreet Restaurant'}</div>
//                         <div class="restaurant-info">${restaurant?.restaurantDetails?.address || 'Restaurant Address'}</div>
//                         ${restaurant?.restaurantDetails?.contactNumber ? `<div class="restaurant-info">Tel: ${restaurant.restaurantDetails.contactNumber}</div>` : ''}
//                         <div class="restaurant-info">GST - 24AAYFT4562G1ZO</div>
//                     </div>

//                     <div class="divider"></div>
//                     <div class="info-row"><span>Name:</span> <span>${order.customerInfo?.name || 'Guest'}</span></div>
//                     <div class="divider"></div>

//                     <div class="info-row">
//                         <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
//                         <span>Dine In: ${order.tableNumber || 'N/A'}</span>
//                     </div>
//                     <div class="info-row">
//                         <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//                     </div>
//                     <div class="info-row">
//                         <span>Cashier: Admin</span>
//                         <span>Bill No: ${order._id.slice(-4)}</span>
//                     </div>

//                     <div class="divider"></div>
//                     <div class="table-header">
//                         <div style="flex: 1;">No.Item</div>
//                         <div style="width: 30px; text-align: center;">Qty</div>
//                         <div style="width: 60px; text-align: right;">Price</div>
//                         <div style="width: 70px; text-align: right;">Amt</div>
//                     </div>
//                     <div class="divider"></div>

//                     ${itemsRows}

//                     <div class="divider"></div>
//                     <div class="info-row" style="font-weight: bold;">
//                         <span>Total Qty: ${order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}</span>
//                         <span>Sub Total: ${currencySymbol}${subtotal.toFixed(2)}</span>
//                     </div>
//                     <div class="info-row">
//                         <span>CGST@2.5%</span>
//                         <span>${currencySymbol}${cgst.toFixed(2)}</span>
//                     </div>
//                     <div class="info-row">
//                         <span>SGST@2.5%</span>
//                         <span>${currencySymbol}${sgst.toFixed(2)}</span>
//                     </div>
//                     <div class="divider"></div>
//                     <div class="info-row" style="font-size: 16px; font-weight: bold;">
//                         <span>Grand Total</span>
//                         <span>${currencySymbol}${grandTotal.toFixed(2)}</span>
//                     </div>
//                     <div class="divider"></div>

//                     <div class="footer">Thank You Visit Again</div>
//                 </body>
//                 <script>
//                     window.onload = () => { window.print(); window.close(); }
//                 </script>
//                 </html>
//             `;
//             printWindow.document.write(html);
//             printWindow.document.close();
//         } catch (e) {
//             console.error('Print failed', e);
//         }
//     };

//     // calculator removed per request

//     // show full-page loader while initial data is being fetched
//     if (loading && (!orders || orders.length === 0)) {
//         return (
//             <div className="min-h-[60vh] flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-4">
//                     <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
//                     <p className="text-gray-500">Loading orders...</p>
//                 </div>
//             </div>
//         );
//     }

//     // Filtered History Logic
//     const filteredHistory = orders.filter(o => {
//         if (o.status !== 'completed') return false;

//         const orderDate = new Date(o.createdAt);
//         const today = new Date();
//         const targetDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
//         const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

//         if (historyFilter === 'Today') {
//             return targetDate.getTime() === currentDate.getTime();
//         } else if (historyFilter === 'Yesterday') {
//             const yesterday = new Date(currentDate);
//             yesterday.setDate(currentDate.getDate() - 1);
//             return targetDate.getTime() === yesterday.getTime();
//         } else if (historyFilter === 'Last Week') {
//             const lastWeek = new Date(currentDate);
//             lastWeek.setDate(currentDate.getDate() - 7);
//             return targetDate >= lastWeek && targetDate <= currentDate;
//         }
//         return true;
//     });

//     return (
//         <div className="space-y-8">
//             {/* Dashboard Main Title */}
//             <div className="mb-8">
//                 <h1 className="text-[20px] sm:text-[24px] lg:text-[30px] font-normal text-black tracking-tight leading-none">Orders</h1>
//                 <p className="text-gray-500">Manage your restaurant active orders</p>
//             </div>

//             {/* Stats Row */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
//                 {/* Pending Orders */}
//                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center h-40 relative group hover:shadow-md transition-all">
//                     <div className="flex items-center gap-4 mb-3">
//                         <div className="w-10 h-10 flex items-center justify-center">
//                             <img src={clockIcon} alt="Pending" className="w-full h-full object-contain" />
//                         </div>
//                         <span className="text-4xl text-gray-900">{stats.pending}</span>
//                     </div>
//                     <p className="text-gray-400 text-sm pl-1">Total Pending Orders</p>
//                 </div>

//                 {/* Preparing Orders */}
//                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center h-40 relative group hover:shadow-md transition-all">
//                     <div className="flex items-center gap-4 mb-3">
//                         <div className="w-10 h-10 flex items-center justify-center">
//                             <img src={chefHatIcon} alt="Preparing" className="w-full h-full object-contain" />
//                         </div>
//                         <span className="text-4xl text-gray-900">{stats.preparing}</span>
//                     </div>
//                     <p className="text-gray-400 text-sm pl-1">Preparing Orders</p>
//                 </div>

//                 {/* Ready Orders */}
//                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center h-40 relative group hover:shadow-md transition-all">
//                     <div className="flex items-center gap-4 mb-3">
//                         <div className="w-10 h-10 flex items-center justify-center">
//                             <img src={bellIcon} alt="Ready" className="w-full h-full object-contain" />
//                         </div>
//                         <span className="text-4xl text-gray-900">{stats.ready}</span>
//                     </div>
//                     <p className="text-gray-400 text-sm pl-1">Ready to serve</p>
//                 </div>

//                 {/* Today Orders Complete Card */}
//                 <div className={`p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden bg-gradient-to-b from-white to-[#F9FAFB] flex flex-col justify-between h-40 lg:col-span-2`}>
//                     <div className="flex justify-between items-start mb-2">
//                         <p className="text-gray-800 text-lg font-normal leading-tight max-w-[50%]">Today Orders Complete</p>
//                         <div className="text-right">
//                             <span className="text-4xl font-normal text-gray-900">{stats.completed}</span>
//                             <span className="text-2xl font-light text-gray-400">/{stats.total}</span>
//                         </div>
//                     </div>

//                     {/* Custom Process Bar */}
//                     <div className="w-full relative mt-auto">
//                         <div className="flex justify-between text-[10px] text-gray-400 font-normal mb-1 px-0.5">
//                             <span>0%</span>
//                             <span className="ml-[10%]">33%</span>
//                             <span className="ml-[15%]">60%</span>
//                             <span>100%</span>
//                         </div>
//                         <div className="h-4 w-full bg-gray-200/50 rounded-full overflow-hidden relative flex">
//                             <div className="absolute inset-0 w-full h-full bg-black/5"></div>
//                             <div
//                                 className="h-full rounded-full transition-all duration-1000 ease-out"
//                                 style={{
//                                     width: `${completionPercentage}%`,
//                                     background: completionPercentage < 33
//                                         ? `linear-gradient(90deg, #FBBF24, #FCD34D)`
//                                         : completionPercentage < 60
//                                             ? `linear-gradient(90deg, #FCD34D, #84CC16)`
//                                             : `linear-gradient(90deg, #84CC16, #22C55E)`
//                                 }}
//                             ></div>
//                             <div className="absolute top-0 left-[33%] w-0.5 h-full bg-white/80"></div>
//                             <div className="absolute top-0 left-[60%] w-0.5 h-full bg-white/80"></div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Active Orders Section */}
//             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between mb-8">
//                     <h2 className="text-2xl text-gray-800">Active Order</h2>
//                     <div className="flex gap-4">
//                         <div className="relative">
//                             <input
//                                 type="text"
//                                 placeholder="Search..."
//                                 className="pl-10 pr-4 py-3 bg-gray-50 rounded-full text-sm w-80 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-400"
//                             />
//                             <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                         </div>
//                         <button
//                             onClick={fetchOrders}
//                             className={`p-3 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors ${loading ? 'animate-spin' : ''}`}
//                         >
//                             <Loader2 className="w-5 h-5" />
//                         </button>
//                     </div>
//                 </div>

//                 {activeOrders.length > 0 ? (
//                     <div className="space-y-4">
//                         {activeOrders.map(order => {
//                             const statusTextColor = order.status === 'pending'
//                                 ? 'text-red-600'
//                                 : order.status === 'preparing'
//                                     ? 'text-yellow-600'
//                                     : 'text-green-600';

//                             const statusBgColor = order.status === 'pending'
//                                 ? 'bg-red-100'
//                                 : order.status === 'preparing'
//                                     ? 'bg-yellow-100'
//                                     : 'bg-green-100';

//                             return (
//                                 <div key={order._id} className="relative flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">

//                                     <div className="flex items-center gap-4">
//                                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100">
//                                             <UtensilsCrossed className={`w-5 h-5 ${statusTextColor}`} />
//                                         </div>
//                                         <div>
//                                             <h4 className="text-gray-900 text-lg">Order #{order._id.slice(-4)}</h4>
//                                             <p className="text-sm text-gray-500"><span className="capitalize">{order.tableNumber ? `Table #${order.tableNumber}` : 'Takeaway'}</span></p>
//                                         </div>
//                                     </div>
//                                     <div className="flex items-center gap-4">
//                                         <button
//                                             onClick={() => setSelectedOrder(order)}
//                                             className="px-5 py-2 bg-[#FD6941] text-white rounded-full text-sm hover:bg-[#FD6941] transition-colors"
//                                         >
//                                             View Details
//                                         </button>
//                                         <span className={`px-4 py-1.5 rounded-full text-xs uppercase font-normal ${statusTextColor} ${statusBgColor}`}>{order.status}</span>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 ) : (
//                     <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
//                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
//                             <UtensilsCrossed className="w-8 h-8 text-gray-300" />
//                         </div>
//                         <h3 className="text-lg font-normal text-gray-800 mb-1">No Active Orders</h3>
//                         <p className="text-gray-400 text-sm max-w-[200px]">New orders will appear here in real-time once placed by customers.</p>
//                     </div>
//                 )}
//             </div>

//             {/* Order History Section */}
//             {stats.completed > 0 && (
//                 <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
//                     <div className="flex items-center justify-between mb-8">
//                         <h2 className="text-2xl text-gray-800">Order History</h2>
//                         <div className="relative">
//                             <select
//                                 value={historyFilter}
//                                 onChange={(e) => setHistoryFilter(e.target.value)}
//                                 className="appearance-none bg-gray-50 border border-gray-100 text-gray-700 py-2.5 pl-5 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FD6941]/20 cursor-pointer font-normal text-sm tracking-wide"
//                             >
//                                 <option value="Today">Today</option>
//                                 <option value="Yesterday">Yesterday</option>
//                                 <option value="Last Week">Last Week</option>
//                             </select>
//                             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     {filteredHistory.length > 0 ? (
//                         <div className="space-y-4">
//                             {filteredHistory.map(order => (
//                                 <div key={order._id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
//                                     <div className="flex items-center gap-4">
//                                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100">
//                                             <UtensilsCrossed className="w-5 h-5 text-green-600" />
//                                         </div>
//                                         <div>
//                                             <h4 className="text-gray-900 text-lg">Order #{order._id.slice(-4)}</h4>
//                                             <p className="text-sm text-gray-500"><span className="capitalize">{order.tableNumber ? `Table #${order.tableNumber}` : 'Takeaway'}</span> • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
//                                         </div>
//                                     </div>
//                                     <div className="flex items-center gap-4">
//                                         <button
//                                             onClick={() => setSelectedOrder(order)}
//                                             className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100 hover:shadow-sm transition-all hover:bg-gray-50 text-gray-400 hover:text-[#FD6941]"
//                                             title="View Invoice"
//                                         >
//                                             <FileText className="w-5 h-5" />
//                                         </button>
//                                         <span className="px-4 py-1.5 rounded-full text-xs uppercase font-normal text-green-600 bg-green-100">Completed</span>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
//                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
//                                 <UtensilsCrossed className="w-8 h-8 text-gray-300" />
//                             </div>
//                             <h3 className="text-lg font-normal text-gray-800 mb-1">No Completed Orders</h3>
//                             <p className="text-gray-400 text-sm max-w-[200px]">No orders found for {historyFilter.toLowerCase()}.</p>
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* Order Details Modal - Card View */}
//             {selectedOrder && createPortal(
//                 <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
//                     <div className="bg-gradient-to-br from-gray-50 to-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative">
//                         {/* Print Button */}
//                         <button
//                             onClick={() => handlePrint(selectedOrder)}
//                             className="absolute top-6 right-16 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors z-10"
//                         >
//                             <Printer className="w-4 h-4" />
//                         </button>

//                         {/* Close Button */}
//                         <button
//                             onClick={() => setSelectedOrder(null)}
//                             className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors z-10"
//                         >
//                             <X className="w-5 h-5" />
//                         </button>

//                         <div className="p-8">
//                             {selectedOrder.status === 'completed' ? (
//                                 /* Receipt Preview Card */
//                                 <div className="bg-white mx-auto shadow-sm border border-gray-200 p-8 font-mono text-black relative mb-8" style={{ width: '380px' }}>
//                                     {/* Print Button inside receipt */}
//                                     <button
//                                         onClick={() => handlePrint(selectedOrder)}
//                                         className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors no-print"
//                                         title="Print Thermal Receipt"
//                                     >
//                                         <Printer className="w-5 h-5" />
//                                     </button>

//                                     <div className="text-center mb-6">
//                                         <h2 className="text-xl font-normal uppercase mb-1 tracking-tight">{restaurant?.name || 'EatGreet Restaurant'}</h2>
//                                         <p className="text-[12px] leading-tight mb-0.5">{restaurant?.restaurantDetails?.address || 'Restaurant Address'}</p>
//                                         {restaurant?.restaurantDetails?.contactNumber && (
//                                             <p className="text-[12px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Tel: {restaurant.restaurantDetails.contactNumber}</p>
//                                         )}
//                                         <p className="text-[12px]">GST - 24AAYFT4562G1ZO</p>
//                                     </div>

//                                     <div className="border-t border-dashed border-black my-4"></div>
//                                     <div className="flex justify-between text-[13px] mb-1">
//                                         <span>Name:</span>
//                                         <span className="font-normal">{selectedOrder.customerInfo?.name || 'Guest'}</span>
//                                     </div>
//                                     <div className="border-t border-dashed border-black my-4"></div>

//                                     <div className="flex justify-between text-[13px] mb-1">
//                                         <span>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
//                                         <span>Dine In: {selectedOrder.tableNumber || 'N/A'}</span>
//                                     </div>
//                                     <div className="flex justify-between text-[13px] mb-1">
//                                         <span>Time: {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//                                     </div>
//                                     <div className="flex justify-between text-[13px] mb-1">
//                                         <span>Cashier: Admin</span>
//                                         <span>Bill No: {selectedOrder._id.slice(-4)}</span>
//                                     </div>

//                                     <div className="border-t border-dashed border-black my-4"></div>
//                                     <div className="flex justify-between font-normal text-[13px] mb-2 uppercase">
//                                         <span style={{ flex: 1 }}>No.Item</span>
//                                         <span style={{ width: '30px', textAlign: 'center' }}>Qty</span>
//                                         <span style={{ width: '60px', textAlign: 'right' }}>Price</span>
//                                         <span style={{ width: '70px', textAlign: 'right' }}>Amt</span>
//                                     </div>
//                                     <div className="border-t border-dashed border-black my-4"></div>

//                                     <div className="space-y-2 mb-4">
//                                         {(selectedOrder.items || []).map((it, i) => (
//                                             <div key={i} className="flex justify-between text-[13px]">
//                                                 <span style={{ flex: 1 }}>{i + 1}.{it.name}</span>
//                                                 <span style={{ width: '30px', textAlign: 'center' }}>{it.quantity || 1}</span>
//                                                 <span style={{ width: '60px', textAlign: 'right' }}>{(it.price || 0).toFixed(2)}</span>
//                                                 <span style={{ width: '70px', textAlign: 'right' }}>{(it.price * (it.quantity || 1)).toFixed(2)}</span>
//                                             </div>
//                                         ))}
//                                     </div>

//                                     <div className="border-t border-dashed border-black my-4"></div>
//                                     <div className="flex justify-between font-normal text-[13px] mb-1">
//                                         <span>Total Qty: {selectedOrder.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}</span>
//                                         <span>Sub Total: {currencySymbol}{(selectedOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0).toFixed(2)}</span>
//                                     </div>
//                                     <div className="flex justify-between text-[13px] mb-1">
//                                         <span>CGST@2.5%</span>
//                                         <span>{currencySymbol}{((selectedOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0) * 0.025).toFixed(2)}</span>
//                                     </div>
//                                     <div className="flex justify-between text-[13px] mb-1">
//                                         <span>SGST@2.5%</span>
//                                         <span>{currencySymbol}{((selectedOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0) * 0.025).toFixed(2)}</span>
//                                     </div>
//                                     <div className="border-t border-dashed border-black my-4"></div>
//                                     <div className="flex justify-between font-normal text-lg mb-4">
//                                         <span>Grand Total</span>
//                                         <span>{currencySymbol}{(selectedOrder.totalAmount || (selectedOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) * 1.05)).toFixed(2)}</span>
//                                     </div>
//                                     <div className="border-t border-dashed border-black my-4"></div>

//                                     <div className="text-center font-normal text-[16px] uppercase tracking-widest mt-6">
//                                         Thank You Visit Again
//                                     </div>
//                                 </div>
//                             ) : (
//                                 /* Order Details Card (Original Aesthetic) */
//                                 <>
//                                     <div className="flex items-start justify-between mb-8">
//                                         <div>
//                                             <h2 className="text-3xl text-gray-900 mb-2 font-normaltracking-tight tracking-tight">Order #{selectedOrder._id.slice(-4)}</h2>
//                                             <p className="text-gray-500 font-normal">Order details and active items</p>
//                                         </div>
//                                         <span className={`px-5 py-2 rounded-full text-xs uppercase font-normal tracking-wider ${getStatusColor(selectedOrder.status)}`}>
//                                             {selectedOrder.status}
//                                         </span>
//                                     </div>

//                                     <div className="grid grid-cols-4 gap-4 mb-8 pb-8 border-b border-gray-100">
//                                         <div className="flex items-center gap-3">
//                                             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
//                                                 <img src={diningIcon} alt="Table" className="w-6 h-6 opacity-60" />
//                                             </div>
//                                             <div>
//                                                 <p className="text-[10px] text-gray-400 uppercase font-normal tracking-wider">Table</p>
//                                                 <p className="text-lg text-gray-900 font-normal">{selectedOrder.tableNumber || 'Self'}</p>
//                                             </div>
//                                         </div>
//                                         <div className="flex items-center gap-3">
//                                             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
//                                                 <img src={userIcon} alt="Customer" className="w-6 h-6 opacity-60" />
//                                             </div>
//                                             <div>
//                                                 <p className="text-[10px] text-gray-400 uppercase font-normal tracking-wider">Guest</p>
//                                                 <p className="text-lg text-gray-900 font-normal">{(selectedOrder.customerInfo?.name || 'User').split(' ')[0]}</p>
//                                             </div>
//                                         </div>
//                                         <div className="flex items-center gap-3">
//                                             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
//                                                 <img src={clockIcon} alt="Time" className="w-6 h-6 opacity-60" />
//                                             </div>
//                                             <div>
//                                                 <p className="text-[10px] text-gray-400 uppercase font-normal tracking-wider">Time</p>
//                                                 <p className="text-lg text-gray-900 font-normal">{getOrderTime(selectedOrder.createdAt)}</p>
//                                             </div>
//                                         </div>
//                                         <div className="flex items-center gap-3">
//                                             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
//                                                 <img src={groupIcon} alt="Items" className="w-6 h-6 opacity-60" />
//                                             </div>
//                                             <div>
//                                                 <p className="text-[10px] text-gray-400 uppercase font-normal tracking-wider">Items</p>
//                                                 <p className="text-lg text-gray-900 font-normal">{selectedOrder.items?.length || 0}</p>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* Timer Section for Active Orders */}
//                                     <div className="flex justify-center mb-10">
//                                         <div className="relative w-36 h-36 flex items-center justify-center bg-white rounded-full shadow-inner border-4 border-gray-50">
//                                             <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
//                                                 <circle cx="50" cy="50" r="46" fill="none" stroke="#F3F4F6" strokeWidth="4" />
//                                                 <circle
//                                                     cx="50" cy="50" r="46" fill="none"
//                                                     stroke={selectedOrder.status === 'pending' ? '#FD6941' : selectedOrder.status === 'preparing' ? '#EAB308' : '#22C55E'}
//                                                     strokeWidth="4"
//                                                     strokeDasharray={`${(timers[selectedOrder._id] / 900) * 289} 289`}
//                                                     strokeLinecap="round"
//                                                     className="transition-all duration-1000"
//                                                 />
//                                             </svg>
//                                             <div className="text-center z-10">
//                                                 <div className="text-4xl font-normal text-gray-900 leading-none">{formatTime(timers[selectedOrder._id] || 0)}</div>
//                                                 <p className="text-[10px] text-gray-400 mt-1 uppercase font-normal tracking-widest">Remaining</p>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <div className="mb-8 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
//                                         <h3 className="text-[10px] text-gray-400 uppercase font-normal tracking-widest mb-4">Order Items</h3>
//                                         <div className="space-y-4">
//                                             {(selectedOrder.items || []).map((item, idx) => (
//                                                 <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
//                                                     <div className="flex items-center gap-4">
//                                                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-normal text-gray-400 border border-gray-100 shadow-sm">
//                                                             {item.quantity}x
//                                                         </div>
//                                                         <div>
//                                                             <p className="text-gray-900 font-normal">{item.name}</p>
//                                                             <p className="text-xs text-gray-400 font-normal">{currencySymbol}{item.price.toFixed(2)} / unit</p>
//                                                         </div>
//                                                     </div>
//                                                     <div className="text-right">
//                                                         <p className="text-gray-900 font-normal">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>

//                                     <div className="flex items-center justify-between p-6 bg-gray-900 rounded-[2rem] text-white mb-8 shadow-xl">
//                                         <div>
//                                             <p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest mb-1.5 opacity-60">Grand Total Amount</p>
//                                             <p className="text-4xl font-normal leading-none">{currencySymbol}{(selectedOrder.totalAmount || 0).toFixed(2)}</p>
//                                         </div>
//                                         <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
//                                             <Hash className="w-6 h-6 text-white opacity-40" />
//                                         </div>
//                                     </div>

//                                     <div className="flex gap-4">
//                                         <button
//                                             onClick={() => {
//                                                 updateOrderStatus(selectedOrder._id, getNextStatus(selectedOrder.status));
//                                                 setSelectedOrder(null);
//                                             }}
//                                             className={`flex-1 ${getStatusButtonColor(selectedOrder.status)} text-white py-5 rounded-[1.8rem] transition-all text-lg font-normal shadow-lg hover:shadow-xl active:scale-[0.98] outline-none`}
//                                         >
//                                             {getNextStatusLabel(selectedOrder.status)}
//                                         </button>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 </div>,
//                 document.body
//             )}
//         </div>
//     );
// };

// export default AdminOrders;

import { Clock, Loader2, UtensilsCrossed, X, ChevronLeft, ChevronRight, Printer, FileText, User, Calendar, Hash, Search, RefreshCw, ChevronDown, Table2, ShoppingBag, Bell, ChefHat, Utensils, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { orderAPI, statsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import EatGreetLogo from '../../assets/logo-full.png';
import '@google/model-viewer';

const UserIcon = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} style={style}>
        <path fill="currentColor" d="M12 11.9751c-1.1 0 -2 -0.35 -2.7 -1.05 -0.7 -0.7 -1.05 -1.6 -1.05 -2.7s0.35 -2 1.05 -2.7c0.7 -0.7 1.6 -1.05 2.7 -1.05s2 0.35 2.7 1.05c0.7 0.7 1.05 1.6 1.05 2.7s-0.35 2 -1.05 2.7c-0.7 0.7 -1.6 1.05 -2.7 1.05Zm-8 6.525v-0.85c0 -0.63335 0.158335 -1.175 0.475 -1.625 0.316665 -0.45 0.725 -0.79165 1.225 -1.025 1.11665 -0.5 2.1875 -0.875 3.2125 -1.125s2.05415 -0.375 3.0875 -0.375 2.05835 0.12915 3.075 0.3875c1.01665 0.25835 2.08265 0.63075 3.198 1.11725 0.52165 0.2355 0.9399 0.5769 1.25475 1.02425 0.31485 0.44735 0.47225 0.98765 0.47225 1.621v0.85c0 0.4125 -0.14685 0.7656 -0.4405 1.05925 -0.29385 0.29385 -0.647 0.44075 -1.0595 0.44075H5.5c-0.4125 0 -0.765585 -0.1469 -1.05925 -0.44075C4.146915 19.2657 4 18.9126 4 18.5001Zm1.5 0h13v-0.85c0 -0.26665 -0.07915 -0.52085 -0.2375 -0.7625 -0.15835 -0.24165 -0.35415 -0.42085 -0.5875 -0.5375 -1.06665 -0.51665 -2.04165 -0.87085 -2.925 -1.0625 -0.88335 -0.19165 -1.8 -0.2875 -2.75 -0.2875s-1.875 0.09585 -2.775 0.2875c-0.9 0.19165 -1.875 0.54585 -2.925 1.0625 -0.23335 0.11665 -0.425 0.29585 -0.575 0.5375 -0.15 0.24165 -0.225 0.49585 -0.225 0.7625v0.85Zm6.5 -8.025c0.65 0 1.1875 -0.2125 1.6125 -0.6375 0.425 -0.425 0.6375 -0.9625 0.6375 -1.6125s-0.2125 -1.1875 -0.6375 -1.6125c-0.425 -0.425 -0.9625 -0.6375 -1.6125 -0.6375s-1.1875 0.2125 -1.6125 0.6375c-0.425 0.425 -0.6375 0.9625 -0.6375 1.6125s0.2125 1.1875 0.6375 1.6125c0.425 0.425 0.9625 0.6375 1.6125 0.6375Z" />
    </svg>
);

const TimeIcon = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} style={style}>
        <path fill="currentColor" d="M12.825 11.7v-4.275c0 -0.21665 -0.07085 -0.39585 -0.2125 -0.5375s-0.32085 -0.2125 -0.5375 -0.2125c-0.21665 0 -0.39585 0.07085 -0.5375 0.2125s-0.2125 0.32085 -0.2125 0.5375V12c0 0.1 0.01665 0.19165 0.05 0.275 0.03335 0.08335 0.08335 0.16665 0.15 0.25l3.6 3.725c0.15 0.16665 0.3375 0.24585 0.5625 0.2375 0.225 -0.00835 0.4125 -0.0875 0.5625 -0.2375 0.15 -0.15 0.225 -0.33335 0.225 -0.55 0 -0.21665 -0.075 -0.4 -0.225 -0.55l-3.425 -3.45ZM12 22c-1.36665 0 -2.65835 -0.2625 -3.875 -0.7875 -1.21665 -0.525 -2.27915 -1.24165 -3.1875 -2.15 -0.908335 -0.90835 -1.625 -1.97085 -2.15 -3.1875C2.2625 14.65835 2 13.36665 2 12s0.2625 -2.65835 0.7875 -3.875c0.525 -1.21665 1.241665 -2.27915 2.15 -3.1875 0.90835 -0.908335 1.97085 -1.625 3.1875 -2.15C9.34165 2.2625 10.63335 2 12 2s2.65835 0.2625 3.875 0.7875c1.21665 0.525 2.27915 1.241665 3.1875 2.15 0.90835 0.90835 1.625 1.97085 2.15 3.1875C21.7375 9.34165 22 10.63335 22 12s-0.2625 2.65835 -0.7875 3.875c-0.525 1.21665 -1.24165 2.27915 -2.15 3.1875s-1.97085 1.625 -3.1875 2.15C14.65835 21.7375 13.36665 22 12 22Zm0 -1.5c2.33335 0 4.33335 -0.83335 6 -2.5 1.66665 -1.66665 2.5 -3.66665 2.5 -6s-0.83335 -4.33335 -2.5 -6c-1.66665 -1.666665 -3.66665 -2.5 -6 -2.5s-4.33335 0.833335 -6 2.5c-1.666665 1.66665 -2.5 3.66665 -2.5 6s0.833335 4.33335 2.5 6c1.66665 1.66665 3.66665 2.5 6 2.5Z" />
    </svg>
);

const ChecklistIcon = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className} style={style}>
        <path fill="currentColor" d="m5.55 16.52495 3.95 -3.95c0.15 -0.15 0.325 -0.2208 0.525 -0.2125 0.2 0.00835 0.37825 0.0875 0.53475 0.2375 0.1435 0.15 0.21525 0.325 0.21525 0.525s-0.075 0.375 -0.225 0.525l-4.475 4.475c-0.15 0.15 -0.325 0.225 -0.525 0.225s-0.375 -0.075 -0.525 -0.225l-2.50001 -2.5c-0.15 -0.15 -0.225 -0.325 -0.225 -0.525s0.075 -0.375 0.225 -0.525c0.15 -0.15 0.325 -0.2208 0.525 -0.2125 0.2 0.00835 0.375 0.0792 0.525 0.2125l1.97501 1.95Zm0 -8L9.5 4.574975c0.15 -0.15 0.325 -0.220835 0.525 -0.2125 0.2 0.008335 0.37825 0.0875 0.53475 0.2375 0.1435 0.15 0.21525 0.325 0.21525 0.524975 0 0.2 -0.075 0.375 -0.225 0.525l-4.475 4.475c-0.15 0.15 -0.325 0.225 -0.525 0.225s-0.375 -0.075 -0.525 -0.225l-2.50001 -2.5c-0.15 -0.15 -0.225 -0.325 -0.225 -0.525s0.075 -0.375 0.225 -0.525c0.15 -0.15 0.325 -0.2208 0.525 -0.2125 0.2 0.00835 0.375 0.0792 0.525 0.2125l1.97501 1.95Zm8.2 8.225c-0.2125 0 -0.3906 -0.0723 -0.53425 -0.217 -0.14385 -0.1445 -0.21575 -0.32365 -0.21575 -0.5375 0 -0.21365 0.0719 -0.3913 0.21575 -0.533 0.14365 -0.14165 0.32175 -0.2125 0.53425 -0.2125h7.5c0.2125 0 0.39065 0.07235 0.5345 0.217 0.14365 0.1445 0.2155 0.3237 0.2155 0.5375 0 0.2137 -0.07185 0.39135 -0.2155 0.533 -0.14385 0.1417 -0.322 0.2125 -0.5345 0.2125h-7.5Zm0 -8c-0.2125 0 -0.3906 -0.0723 -0.53425 -0.217 -0.14385 -0.1445 -0.21575 -0.32365 -0.21575 -0.5375 0 -0.21365 0.0719 -0.3913 0.21575 -0.533 0.14365 -0.14165 0.32175 -0.2125 0.53425 -0.2125h7.5c0.2125 0 0.39065 0.07235 0.5345 0.217 0.14365 0.1445 0.2155 0.3237 0.2155 0.5375 0 0.2137 -0.07185 0.39135 -0.2155 0.533 -0.14385 0.1417 -0.322 0.2125 -0.5345 0.2125h-7.5Z" />
    </svg>
);

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

const StatCard = ({ icon: Icon, value, title }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 rounded-full">
                <Icon className="w-6 h-6 text-gray-700" />
            </div>
            <div>
                <h3 className="text-4xl font-bold text-gray-800">{value}</h3>
            </div>
        </div>
        <p className="text-gray-500 font-medium ml-1">{title}</p>
    </div>
);

StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        preparing: 0,
        ready: 0,
        completed: 0
    });
    const [loading, setLoading] = useState(true);
    const { currencySymbol } = useSettings();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]); // Array of indices
    const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
    const [searchQuery, setSearchQuery] = useState('');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyFilter, setHistoryFilter] = useState('today'); // 'today', 'yesterday', 'lastWeek'
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [timers, setTimers] = useState({});
    const [restaurant, setRestaurant] = useState(null);
    const socket = useSocket();
    const { user } = useSettings();
    const lastItemCounts = useRef({});

    const openInvoiceModal = (order) => {
        setInvoiceOrder(order);
        setIsInvoicePreviewOpen(true);
    };

    const [searchParams, setSearchParams] = useSearchParams();
    const orderIdParam = searchParams.get('orderId');

    // Deep link handling for dashboard notifications (once per redirect)
    useEffect(() => {
        if (orderIdParam && orders.length > 0) {
            const linkedOrder = orders.find(o => o._id === orderIdParam);
            if (linkedOrder) {
                setSelectedOrder(linkedOrder);
                // Clear the param after opening once to prevent re-opening "again and again"
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('orderId');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [orderIdParam, orders, setSearchParams]);

    // Socket Listener for real-time updates
    useEffect(() => {
        if (!socket || !user?.restaurantName) return;

        // Join restaurant room
        socket.emit('joinRestaurant', user.restaurantName);

        const handleUpdate = (payload) => {
            console.log("Order Update Received:", payload.action);
            fetchOrders(); // Refresh everything for simplicity and consistency
            if (payload.action === 'create') {
                toast.success('New order received!', { duration: 5000, icon: '🔔' });
            }
        };

        socket.on('orderUpdated', handleUpdate);
        return () => {
            socket.off('orderUpdated', handleUpdate);
        };
    }, [socket, user?.restaurantName]);

    const fetchRestaurantDetails = async () => {
        try {
            const { restaurantAPI } = await import('../../utils/api');
            const { data } = await restaurantAPI.getDetails();
            setRestaurant(data);
        } catch (error) {
            console.error('Failed to fetch restaurant details', error);
        }
    };

    useEffect(() => {
        fetchRestaurantDetails();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await orderAPI.getOrders();
            const orderList = data || [];
            setOrders(orderList);

            // Filter for today's orders
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayOrders = orderList.filter(o => new Date(o.createdAt) >= today);

            // Calculate stats from orders
            const newStats = {
                total: todayOrders.length,
                pending: orderList.filter(o => o.status === 'pending').length,
                preparing: orderList.filter(o => o.status === 'preparing').length,
                ready: orderList.filter(o => o.status === 'ready').length,
                completed: todayOrders.filter(o => o.status === 'completed').length
            };
            setStats(newStats);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Timer effect for order preparation time
    useEffect(() => {
        const timer = setInterval(() => {
            setTimers(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(orderId => {
                    if (updated[orderId] > 0) {
                        updated[orderId]--;
                    }
                });
                return updated;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getMinPrepTime = (order) => {
        if (!order || !order.items || order.items.length === 0) return 15;

        const prepTimes = order.items.map(item => {
            const timeStr = item.menuItem?.time || "15 min";
            const numbers = timeStr.match(/\d+/g);
            if (!numbers || numbers.length === 0) return 15;
            return Math.min(...numbers.map(Number));
        });

        const minTime = Math.min(...prepTimes);
        return minTime > 0 ? minTime : 15;
    };

    useEffect(() => {
        orders.filter(o => o.status === 'preparing').forEach(order => {
            const currentItemCount = order.items?.length || 0;
            const prevItemCount = lastItemCounts.current[order._id] || 0;

            if (!timers[order._id] || currentItemCount > prevItemCount) {
                const prepMinutes = getMinPrepTime(order);
                setTimers(prev => ({ ...prev, [order._id]: prepMinutes * 60 }));
                lastItemCounts.current[order._id] = currentItemCount;
            }
        });
    }, [orders]);

    const filteredActiveOrders = orders.filter(o => {
        const isActive = ['pending', 'preparing', 'ready'].includes(o.status);
        if (!isActive) return false;
        if (!searchQuery) return true;

        const q = searchQuery.toLowerCase();
        return (
            o._id.toLowerCase().includes(q) ||
            (o.tableNumber && String(o.tableNumber).includes(q)) ||
            (o.customerInfo?.name && o.customerInfo.name.toLowerCase().includes(q))
        );
    });

    const filteredHistoryOrders = orders.filter(o => {
        if (o.status !== 'completed') return false;

        const orderDate = new Date(o.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dateMatch = false;
        if (historyFilter === 'today') {
            dateMatch = orderDate >= today;
        } else if (historyFilter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            dateMatch = orderDate >= yesterday && orderDate < today;
        } else if (historyFilter === 'lastWeek') {
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            dateMatch = orderDate >= lastWeek;
        } else {
            dateMatch = true;
        }

        if (!dateMatch) return false;

        if (!historySearchQuery) return true;
        const q = historySearchQuery.toLowerCase();
        return (
            o._id.toLowerCase().includes(q) ||
            (o.tableNumber && String(o.tableNumber).includes(q)) ||
            (o.customerInfo?.name && o.customerInfo.name.toLowerCase().includes(q))
        );
    });

    const formatOrderId = (order) => {
        if (!order) return 'N/A';
        const date = new Date(order.createdAt);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        const sequence = order.dailySequence ? String(order.dailySequence).padStart(2, '0') : (order._id ? order._id.slice(-2).toUpperCase() : '00');
        return `${dd}${mm}${yy}${sequence}`;
    };

    // Calculate completion percentage
    const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getOrderTime = (createdAt) => {
        if (!createdAt) return 'N/A';
        const date = new Date(createdAt);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const calculateDerivedStatus = (items) => {
        if (!items || items.length === 0) return 'pending';
        const allCompleted = items.every(i => ['completed', 'served'].includes(i.status));
        if (allCompleted) return 'completed';
        const allReady = items.every(i => ['ready', 'served', 'completed'].includes(i.status));
        if (allReady) return 'ready';
        const anyPreparing = items.some(i => i.status === 'preparing');
        if (anyPreparing) return 'preparing';
        return 'pending';
    };

    const toggleItemSelection = (idx) => {
        setSelectedItems(prev =>
            prev.includes(idx)
                ? prev.filter(i => i !== idx)
                : [...prev, idx]
        );
    };

    const handleBulkItemStatusUpdate = async (status) => {
        if (!selectedOrder || selectedItems.length === 0) return;

        const loadToast = toast.loading(`Updating ${selectedItems.length} items to ${status}...`);
        try {
            await Promise.all(
                selectedItems.map(idx => orderAPI.updateItemStatus(selectedOrder._id, idx, status))
            );

            toast.success(`Items marked as ${status}`, { id: loadToast });
            setSelectedItems([]);
            fetchOrders();

            // Update local state for immediate feedback
            const updatedItems = [...selectedOrder.items];
            selectedItems.forEach(idx => {
                updatedItems[idx].status = status;
            });
            // Calculate new derived status based on updated items
            const newDerivedStatus = calculateDerivedStatus(updatedItems);
            setSelectedOrder({ ...selectedOrder, items: updatedItems, status: newDerivedStatus });
        } catch (error) {
            console.error('Bulk update failed', error);
            toast.error('Failed to update some items', { id: loadToast });
        }
    };

    const handleUpdateItemStatus = async (orderId, itemIdx, status) => {
        try {
            await orderAPI.updateItemStatus(orderId, itemIdx, status);
            toast.success(`Item marked as ${status}`);

            // Refresh orders to show updated status
            fetchOrders();

            // If the modal is open, we need to update the selectedOrder state too
            if (selectedOrder && selectedOrder._id === orderId) {
                const updatedItems = [...selectedOrder.items];
                updatedItems[itemIdx].status = status;

                // Calculate new derived status based on updated items
                const newDerivedStatus = calculateDerivedStatus(updatedItems);
                setSelectedOrder({ ...selectedOrder, items: updatedItems, status: newDerivedStatus });
            }
        } catch (error) {
            console.error('Failed to update item status', error);
            toast.error('Failed to update item status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-red-100 text-red-600';
            case 'preparing': return 'bg-yellow-100 text-yellow-600';
            case 'ready': return 'bg-green-100 text-green-600';
            case 'served': return 'bg-blue-100 text-blue-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusButtonColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-[#FD6941] hover:bg-[#FD6941]/90';
            case 'preparing': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'ready': return 'bg-green-500 hover:bg-green-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getNextStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Mark Preparing';
            case 'preparing': return 'Mark Ready';
            default: return 'Update';
        }
    };

    const getNextStatus = (status) => {
        switch (status) {
            case 'pending': return 'preparing';
            case 'preparing': return 'ready';
            default: return status;
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        const loadToast = toast.loading('Updating order status...');
        try {
            await orderAPI.updateStatus(orderId, newStatus);
            toast.success('Order status updated!', { id: loadToast });

            // If marking as preparing, reset the timer to calculated dynamic time
            if (newStatus === 'preparing') {
                const prepMinutes = getMinPrepTime(orders.find(o => o._id === orderId));
                setTimers(prev => ({ ...prev, [orderId]: prepMinutes * 60 }));
            }

            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status', { id: loadToast });
        }
    };

    const handlePrint = (order) => {
        if (!order) return;
        try {
            const printWindow = window.open('', '_blank');
            const subtotal = order.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0;
            const cgst = subtotal * 0.025;
            const sgst = subtotal * 0.025;
            const totalRaw = subtotal + cgst + sgst;
            const grandTotal = Math.round(totalRaw);
            const roundOff = grandTotal - totalRaw;

            const itemsRows = (order.items || []).map(it => `
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                    <span style="flex: 1;">${it.name}</span>
                    <span style="width: 30px; text-align: center;">${it.quantity || 1}</span>
                    <span style="width: 60px; text-align: right;">${(it.price || 0).toFixed(2)}</span>
                    <span style="width: 70px; text-align: right;">${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
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
                        <span>Bill No: ${formatOrderId(order)}</span>
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
                        <span>Sub Total: ${currencySymbol}${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span>CGST@2.5%</span>
                        <span>${currencySymbol}${cgst.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span>SGST@2.5%</span>
                        <span>${currencySymbol}${sgst.toFixed(2)}</span>
                    </div>
                    <div class="info-row" style="font-weight: 700;">
                        <span>Total</span>
                        <span>${currencySymbol}${totalRaw.toFixed(2)}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="info-row">
                        <span>Round Off</span>
                        <span>${currencySymbol}${roundOff.toFixed(2)}</span>
                    </div>
                    <div class="info-row" style="font-size: 16px; font-weight: 700;">
                        <span>Grand Total</span>
                        <span>${currencySymbol}${grandTotal.toFixed(2)}</span>
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
        } catch (e) {
            console.error('Print failed', e);
        }
    };

    if (loading && (!orders || orders.length === 0)) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
                    <p className="text-gray-500">Loading orders...</p>
                </div>
            </div>
        );
    }

    // Calculate order stats safely
    const orderStats = selectedOrder ? (() => {
        const subtotal = selectedOrder.items?.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0) || 0;
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const totalRaw = subtotal + cgst + sgst;
        const grandTotal = Math.round(totalRaw);
        const roundOff = grandTotal - totalRaw;
        return { subtotal, cgst, sgst, totalRaw, grandTotal, roundOff };
    })() : null;

    return (
        <div className="space-y-4 sm:space-y-8 px-1 sm:px-0 pb-20">
            <div className="mb-4 sm:mb-8">
                <h1 className="text-[20px] sm:text-[24px] lg:text-[28px] font-normal text-black tracking-tight leading-none">Orders</h1>
                <p className="text-gray-500 text-sm sm:text-base">Manage your restaurant active orders</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center h-32 sm:h-40 relative group hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 sm:bg-[#F3F3F3] rounded-full flex items-center justify-center shrink-0">
                            <TimeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 sm:text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-4xl text-gray-900">{stats.pending}</span>
                    </div>
                    <p className="text-gray-400 text-[11px] sm:text-sm pl-1">Pending Orders</p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center h-32 sm:h-40 relative group hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 sm:bg-[#F3F3F3] rounded-full flex items-center justify-center shrink-0">
                            <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 sm:text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-4xl text-gray-900">{stats.preparing}</span>
                    </div>
                    <p className="text-gray-400 text-[11px] sm:text-sm pl-1">Preparing</p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center h-32 sm:h-40 relative group hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 sm:bg-[#F3F3F3] rounded-full flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 sm:text-gray-400" />
                        </div>
                        <span className="text-2xl sm:text-4xl text-gray-900">{stats.ready}</span>
                    </div>
                    <p className="text-gray-400 text-[11px] sm:text-sm pl-1">Ready to serve</p>
                </div>

                <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden bg-gradient-to-b from-white to-[#F9FAFB] flex flex-col justify-between h-32 sm:h-40 col-span-2 lg:col-span-2`}>
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <p className="text-gray-800 text-sm sm:text-lg font-normal leading-tight max-w-[50%]">Total Complete</p>
                        <div className="text-right">
                            <span className="text-2xl sm:text-4xl font-normal text-gray-900">{stats.completed}</span>
                            <span className="text-lg sm:text-2xl font-light text-gray-400">/{stats.total}</span>
                        </div>
                    </div>

                    <div className="w-full relative mt-auto">
                        <div className="flex justify-between text-[10px] text-gray-400 font-normal mb-1 px-0.5">
                            <span>0%</span>
                            <span className="ml-[10%]">33%</span>
                            <span className="ml-[15%]">60%</span>
                            <span>100%</span>
                        </div>
                        <div className="h-4 w-full bg-gray-200/50 rounded-full overflow-hidden relative flex">
                            <div className="absolute inset-0 w-full h-full bg-black/5"></div>
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${completionPercentage}%`,
                                    background: completionPercentage < 33
                                        ? `linear-gradient(90deg, #FBBF24, #FCD34D)`
                                        : completionPercentage < 60
                                            ? `linear-gradient(90deg, #FCD34D, #84CC16)`
                                            : `linear-gradient(90deg, #84CC16, #22C55E)`
                                }}
                            ></div>
                            <div className="absolute top-0 left-[33%] w-0.5 h-full bg-white/80"></div>
                            <div className="absolute top-0 left-[60%] w-0.5 h-full bg-white/80"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-sm border border-gray-100">
                <div className="flex flex-row items-center mb-5 sm:mb-8 gap-2 sm:gap-4 justify-between">
                    <h2 className="text-[14px] sm:text-[22px] font-normal text-gray-800 shrink-0">Active Orders</h2>

                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 sm:flex-none max-w-[200px] sm:max-w-none sm:w-80">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-5 sm:h-5 z-10" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-50 border-none sm:border-solid rounded-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#FD6941] placeholder-gray-400 transition-all border border-transparent focus:bg-white"
                            />
                        </div>
                        <button
                            onClick={fetchOrders}
                            className={`p-2 sm:p-3 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors shrink-0 ${loading ? 'opacity-50' : ''}`}
                            title="Refresh Orders"
                        >
                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {filteredActiveOrders.length > 0 ? (
                    <div className="space-y-4">
                        {filteredActiveOrders.map(order => {
                            const statusTextColor = order.status === 'pending' ? 'text-red-600' : order.status === 'preparing' ? 'text-yellow-600' : 'text-green-600';
                            const statusBgColor = order.status === 'pending' ? 'bg-red-100' : order.status === 'preparing' ? 'bg-yellow-100' : 'bg-green-100';

                            return (
                                <div key={order._id} className="flex items-center justify-between p-2.5 sm:p-5 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#FD6941] transition-all gap-1.5 sm:gap-4 group overflow-hidden">
                                    {/* Left: Info - FIXED */}
                                    <div className="flex items-center gap-2 sm:gap-5 shrink-0 min-w-0">
                                        <div className={`w-8 h-8 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border ${order.status === 'pending' ? 'bg-red-50' : order.status === 'preparing' ? 'bg-yellow-50' : 'bg-green-50'} border-transparent group-hover:scale-110 transition-transform`}>
                                            <UtensilsCrossed className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${statusTextColor}`} />
                                        </div>
                                        <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0 justify-center">
                                            <h4 className="text-gray-900 text-[13px] sm:text-lg font-normal whitespace-nowrap">#{formatOrderId(order)}</h4>
                                        </div>
                                    </div>

                                    {/* Item List Display - Scrollable on mobile/tab, wrapped on desktop - FLUID */}
                                    <div className="flex-1 min-w-0 flex items-center overflow-x-auto no-scrollbar sm:overflow-visible ml-1 sm:ml-4 border-l border-gray-50 pl-2 sm:pl-6">
                                        <div className="flex flex-nowrap sm:flex-wrap gap-x-2 sm:gap-x-3 gap-y-2 text-[11px] sm:text-[13px] text-gray-600 font-normal">
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map((item, idx) => (
                                                    <span key={idx} className="bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-100 whitespace-nowrap shrink-0">
                                                        <span className="font-semibold text-black">{item.quantity}x</span> {item.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic">No items</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Status (Desktop) + Action (Both) */}
                                    <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-1 sm:gap-4 shrink-0 px-1">
                                        <div className={`hidden sm:flex px-3 py-1.5 rounded-full border shadow-sm items-center gap-2 ${statusTextColor} ${statusBgColor} border-current/10`}>
                                            <div className="relative flex h-1.5 w-1.5">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${order.status === 'pending' ? 'bg-red-400' : order.status === 'preparing' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${order.status === 'pending' ? 'bg-red-500' : order.status === 'preparing' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                            </div>
                                            <span className="text-[10px] font-normal uppercase tracking-widest">{order.status}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] sm:text-base font-bold text-gray-900 sm:hidden">{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</p>
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-4 py-2 sm:px-8 sm:py-3 bg-gray-900 text-white rounded-xl sm:rounded-full text-[10px] sm:text-sm font-normal hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-normal text-gray-800 mb-1">No Active Orders</h3>
                        <p className="text-gray-400 text-sm max-w-[200px]">New orders will appear here in real-time once placed by customers.</p>
                    </div>
                )}
            </div>

            {/* Order History Section */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-sm border border-gray-100">
                <div className="flex flex-row items-center mb-5 sm:mb-8 gap-2 sm:gap-4 justify-between">
                    <h2 className="text-[14px] sm:text-[22px] font-normal text-gray-800 shrink-0">Order History</h2>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end min-w-0">
                        <div className="relative flex-1 sm:flex-none max-w-[200px] sm:max-w-none sm:w-80">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-5 sm:h-5 z-10" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                className="w-full pl-8 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-50 border-none sm:border-solid rounded-full text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#FD6941] placeholder-gray-400 transition-all border border-transparent focus:bg-white"
                            />
                        </div>
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-1.5 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-transparent bg-gray-50 text-[10px] sm:text-sm font-normal text-gray-500 hover:bg-gray-100 transition-all active:scale-95 h-full"
                            >
                                <span className="hidden sm:inline">{historyFilter.charAt(0).toUpperCase() + historyFilter.slice(1)}</span>
                                <span className="sm:hidden"><Filter className="w-4 h-4" /></span>
                                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-36 bg-white rounded-[1.2rem] shadow-xl border border-gray-50 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {[
                                        { label: 'Today', value: 'today' },
                                        { label: 'Yesterday', value: 'yesterday' },
                                        { label: 'Last Week', value: 'lastWeek' }
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setHistoryFilter(option.value);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[13px] font-normal transition-colors ${historyFilter === option.value ? 'text-[#FD6941] bg-[#FD6941]/5 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {filteredHistoryOrders.length > 0 ? (
                    <div className="space-y-4">
                        {filteredHistoryOrders.map(order => (
                            <div key={order._id} className="flex items-center justify-between p-2.5 sm:p-5 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#FD6941] transition-all gap-1.5 sm:gap-4 group overflow-hidden">
                                {/* Left: Info - FIXED */}
                                <div className="flex items-center gap-2 sm:gap-5 shrink-0 min-w-0">
                                    <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border bg-green-50 border-transparent group-hover:scale-110 transition-transform">
                                        <UtensilsCrossed className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-green-600" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0 justify-center">
                                        <h4 className="text-gray-900 text-[13px] sm:text-lg font-normal whitespace-nowrap">#{formatOrderId(order)}</h4>
                                    </div>
                                </div>
                                {/* Item List Display - Scrollable on mobile/tab, wrapped on desktop - FLUID */}
                                <div className="flex-1 min-w-0 flex items-center overflow-x-auto no-scrollbar sm:overflow-visible ml-1 sm:ml-4 border-l border-gray-50 pl-2 sm:pl-6">
                                    <div className="flex flex-nowrap sm:flex-wrap gap-x-2 sm:gap-x-3 gap-y-2 text-[11px] sm:text-[13px] text-gray-600 font-normal">
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item, idx) => (
                                                <span key={idx} className="bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-100 whitespace-nowrap shrink-0">
                                                    <span className="font-semibold text-black">{item.quantity}x</span> {item.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 italic">No items</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Status + Action */}
                                <div className="flex flex-row justify-end items-center gap-2 sm:gap-4 shrink-0 px-1">
                                    {/* Status moved here for Desktop only */}
                                    <div className="hidden sm:flex px-3 py-1.5 rounded-full border shadow-sm items-center gap-2 text-green-600 bg-green-100 border-green-600/10">
                                        <div className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                        </div>
                                        <span className="text-[10px] font-normal uppercase tracking-widest">Done</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] sm:text-base font-bold text-gray-900 sm:hidden">{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</p>
                                        <button
                                            onClick={() => openInvoiceModal(order)}
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                                            title="View Invoice"
                                        >
                                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-normal text-gray-800 mb-1">No Completed Orders</h3>
                        <p className="text-gray-400 text-sm max-w-[200px]">Completed orders will appear here once marked complete.</p>
                    </div>
                )}
            </div>

            {/* Invoice Preview Modal for Transaction History */}
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
                                    <span className="font-bold">{invoiceOrder.customerInfo?.name || 'Guest'}</span>
                                </div>
                                {invoiceOrder.customerInfo?.phone && (
                                    <div className="flex justify-between text-[13px] mb-1">
                                        <span>Tel:</span>
                                        <span className="font-bold">{invoiceOrder.customerInfo.phone}</span>
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
                                    <span>Bill No: {formatOrderId(invoiceOrder)}</span>
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
                                            <div className="flex justify-between font-bold text-[13px] mb-1">
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
                                            <div className="flex justify-between font-bold text-[13px] mb-1">
                                                <span>Total</span>
                                                <span>{currencySymbol}{totalRaw.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>Round Off</span>
                                                <span>{currencySymbol}{roundOff.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-dashed border-black my-4"></div>
                                            <div className="flex justify-between font-bold text-lg mb-4">
                                                <span>Grand Total</span>
                                                <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )
                                })()}
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
            )}

            {selectedOrder && createPortal(
                <div className="fixed inset-0 w-full h-[100dvh] z-[9999] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="fixed inset-0" onClick={() => { setSelectedOrder(null); setSelectedItems([]); }} />
                    <div className="bg-gradient-to-br from-gray-50 to-white w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in duration-300">

                        <button
                            onClick={() => {
                                setSelectedOrder(null);
                                setSelectedItems([]);
                            }}
                            className="absolute top-4 sm:top-6 right-4 sm:right-6 w-9 h-9 sm:w-11 sm:h-11 bg-white/90 backdrop-blur-md shadow-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all z-50 border border-gray-100"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="overflow-hidden flex flex-col flex-1">
                            {selectedOrder?.status === 'completed' ? (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 bg-gray-100/30">
                                        <div className="bg-white mx-auto shadow-sm border border-gray-200 p-8 font-mono text-black relative my-8" style={{ width: '100%', maxWidth: '380px' }}>
                                            <button
                                                onClick={() => handlePrint(selectedOrder)}
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
                                                <span className="font-bold">{selectedOrder.customerInfo?.name || 'Guest'}</span>
                                            </div>
                                            {selectedOrder.customerInfo?.phone && (
                                                <div className="flex justify-between text-[13px] mb-1">
                                                    <span>Tel:</span>
                                                    <span className="font-bold">{selectedOrder.customerInfo.phone}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-dashed border-black my-4"></div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                                <span>Table: {selectedOrder.tableNumber || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>Time: {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex justify-between text-[13px] mb-1">
                                                <span>Cashier: Admin</span>
                                                <span>Bill No: {formatOrderId(selectedOrder)}</span>
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
                                                {(selectedOrder.items || []).map((it, i) => (
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
                                                <span>Total Qty: {selectedOrder.items?.reduce((acc, it) => acc + (it.quantity || 1), 0)}</span>
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
                                    <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                                        <button
                                            onClick={() => handlePrint(selectedOrder)}
                                            className="flex-1 bg-[#FD6941] text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#e55a35] transition-all font-medium"
                                        >
                                            <Printer className="w-5 h-5" />
                                            Print Receipt
                                        </button>
                                        <button
                                            onClick={() => { setSelectedOrder(null); setSelectedItems([]); }}
                                            className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl hover:bg-gray-200 transition-all font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-10 mb-4">
                                        <div className="mb-6 sm:mb-8 mt-8 sm:mt-10">
                                            <h2 className="text-2xl sm:text-4xl text-gray-900 mb-1 font-normal tracking-tighter ">Order #{formatOrderId(selectedOrder)}</h2>
                                            <p className="text-gray-400 text-[8px] sm:text-xs font-semibold uppercase tracking-[0.3em]">Live Order View</p>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 pb-2 border-b border-gray-50/50">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <TableIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[7px] sm:text-[10px] text-gray-400 uppercase font-normal tracking-wider">Table</p>
                                                    <p className="text-sm sm:text-lg text-gray-900 font-normal">{selectedOrder.tableNumber || 'Self'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[7px] sm:text-[10px] text-gray-400 uppercase font-normal tracking-wider">Customer</p>
                                                    <p className="text-sm sm:text-lg text-gray-900 font-normal truncate max-w-[80px] sm:max-w-[150px]" title={selectedOrder.customerInfo?.name}>{selectedOrder.customerInfo?.name || 'Guest'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <TimeIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[7px] sm:text-[10px] text-gray-400 uppercase font-normal tracking-wider">Time</p>
                                                    <p className="text-sm sm:text-lg text-gray-900 font-normal">{getOrderTime(selectedOrder.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <ChecklistIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[7px] sm:text-[10px] text-gray-400 uppercase font-normal tracking-wider">Items</p>
                                                    <p className="text-sm sm:text-lg text-gray-900 font-normal">{selectedOrder.items?.length || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="relative w-24 h-24 sm:w-36 sm:h-36 flex items-center justify-center bg-white rounded-full shadow-inner border-[3px] border-gray-50">
                                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="46" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                                                    <circle
                                                        cx="50" cy="50" r="46" fill="none"
                                                        stroke={selectedOrder?.status === 'pending' ? '#FD6941' : selectedOrder?.status === 'preparing' ? '#EAB308' : '#22C55E'}
                                                        strokeWidth="4"
                                                        strokeDasharray={`${(timers[selectedOrder?._id] / 900) * 289} 289`}
                                                        strokeLinecap="round"
                                                        className="transition-all duration-1000"
                                                    />
                                                </svg>
                                                <div className="text-center z-10">
                                                    <p className="text-[10px] sm:text-[14px] font-normal text-gray-400 uppercase tracking-widest">{selectedOrder?.status || 'pending'}</p>
                                                    <p className="text-xl sm:text-3xl font-normal text-gray-900 tracking-tighter">
                                                        {Math.floor(timers[selectedOrder?._id] / 60)}:{String(timers[selectedOrder?._id] % 60).padStart(2, '0')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-10 py-6 bg-gray-50/30">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-[10px] text-gray-400 uppercase font-normal tracking-widest px-1">Order Items</h3>
                                            {selectedOrder.status !== 'completed' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (selectedItems.length === selectedOrder.items?.length) {
                                                            setSelectedItems([]);
                                                        } else {
                                                            setSelectedItems(selectedOrder.items?.map((_, i) => i) || []);
                                                        }
                                                    }}
                                                    className="text-[11px] font-normal text-white bg-[#FD6941] px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-all outline-none"
                                                >
                                                    {selectedItems.length === selectedOrder.items?.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {(selectedOrder.items || []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => !['completed', 'served'].includes(item.status) && toggleItemSelection(idx)}
                                                    className={`relative flex items-center justify-between p-3 sm:p-4 rounded-[1.2rem] sm:rounded-2xl border transition-all cursor-pointer ${selectedItems.includes(idx)
                                                        ? 'bg-[#FD6941]/5 border-[#FD6941] shadow-sm ring-1 ring-[#FD6941]/20'
                                                        : 'bg-white border-gray-100 hover:border-gray-200 opacity-100 shadow-sm'
                                                        }`}
                                                >
                                                    {/* Left Area (Image + Info) */}
                                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-2">
                                                        {selectedOrder.status !== 'completed' && (
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${selectedItems.includes(idx) ? 'bg-[#FD6941] border-[#FD6941]' : 'bg-white border-gray-200'}`}>
                                                                {selectedItems.includes(idx) && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Item Media Thumbnail */}
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                                            {(() => {
                                                                const mItem = item.menuItem || {};
                                                                const images = mItem.media || [];
                                                                const mainImage = mItem.image;

                                                                if (images.length > 0) {
                                                                    return (
                                                                        <img
                                                                            src={images[0].url}
                                                                            alt={item.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    );
                                                                } else if (mainImage) {
                                                                    return (
                                                                        <img
                                                                            src={mainImage}
                                                                            alt={item.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                                            <UtensilsCrossed className="w-6 h-6" />
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>

                                                        <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                                                                <p className="font-normal text-[14px] sm:text-base truncate text-gray-900">{item.name}</p>
                                                                <p className="text-[13px] sm:text-sm font-medium shrink-0 text-gray-500">{item.quantity}x</p>
                                                            </div>
                                                            <p className="text-[11px] sm:text-xs font-normal truncate text-gray-400">{currencySymbol}{item.price.toFixed(2)} / unit</p>
                                                        </div>
                                                    </div>

                                                    {/* Center Area (Status Tag) - Absolute Center */}
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex justify-center items-center pointer-events-none">
                                                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border shadow-sm shrink-0 ${item.status === 'ready' ? 'bg-green-100 text-green-600 border-green-200/50' :
                                                            item.status === 'served' ? 'bg-blue-100 text-blue-600 border-blue-200/50' :
                                                                item.status === 'completed' ? 'bg-gray-100 text-gray-500 border-gray-200/50' :
                                                                    item.status === 'preparing' ? 'bg-yellow-100 text-yellow-600 border-yellow-200/50' :
                                                                        'bg-red-100 text-red-600 border-red-200/50'
                                                            }`}>
                                                            {item.status || 'pending'}
                                                        </span>
                                                    </div>

                                                    {/* Mobile fallback for Status Tag */}
                                                    <div className="sm:hidden flex justify-center items-center shrink-0 mr-2">
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm shrink-0 ${item.status === 'ready' ? 'bg-green-100 text-green-600 border-green-200/50' :
                                                            item.status === 'served' ? 'bg-blue-100 text-blue-600 border-blue-200/50' :
                                                                item.status === 'completed' ? 'bg-gray-100 text-gray-500 border-gray-200/50' :
                                                                    item.status === 'preparing' ? 'bg-yellow-100 text-yellow-600 border-yellow-200/50' :
                                                                        'bg-red-100 text-red-600 border-red-200/50'
                                                            }`}>
                                                            {item.status || 'pending'}
                                                        </span>
                                                    </div>

                                                    {/* Right Area (Total Price) */}
                                                    <div className="shrink-0 text-right sm:pr-2">
                                                        <p className="font-normal sm:font-medium text-sm sm:text-lg text-gray-900">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fixed Bottom Action Area */}
                                    <div className="pt-2 sm:pt-6 px-6 sm:px-10 pb-10 sm:pb-10 border-t border-gray-100 bg-white/50 backdrop-blur-md">
                                        <div
                                            className="flex items-center justify-between p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-3xl text-gray-900 mb-3 sm:mb-6 border border-gray-100 shadow-sm relative overflow-hidden group isolate"
                                            style={{ transform: 'translateZ(0)', WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                                        >
                                            <div className="relative z-10">
                                                <p className="text-[10px] sm:text-xs text-gray-400 font-normal uppercase tracking-widest mb-1">Grand Total</p>
                                                <p className="text-xl sm:text-3xl font-normal tracking-tighter flex items-center gap-1.5 sm:gap-2">
                                                    <span className="text-[#FD6941]">{currencySymbol}</span>
                                                    {(selectedOrder.totalAmount || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="relative z-10 w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm transition-transform group-hover:rotate-12">
                                                <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 font-light" />
                                            </div>
                                            {/* Subtle Ambient Glow */}
                                            <div className="absolute -right-8 -bottom-8 sm:-right-10 sm:-bottom-10 w-32 h-32 sm:w-40 sm:h-40 bg-[#FD6941]/30 blur-[40px] sm:blur-[60px] rounded-full group-hover:bg-[#FD6941]/40 transition-colors pointer-events-none" />
                                        </div>

                                        <div className="flex gap-4">
                                            {selectedItems.length > 0 ? (
                                                <>
                                                    {selectedItems.every(idx => {
                                                        const s = selectedOrder.items[idx].status || 'pending';
                                                        return s === 'pending';
                                                    }) && (
                                                            <button
                                                                onClick={() => handleBulkItemStatusUpdate('preparing')}
                                                                className="flex-1 bg-yellow-500 text-white py-3 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] transition-all text-sm sm:text-lg font-normal shadow-lg hover:shadow-xl active:scale-[0.98] outline-none"
                                                            >
                                                                Mark Preparing ({selectedItems.length})
                                                            </button>
                                                        )}
                                                    {selectedItems.every(idx => {
                                                        const s = selectedOrder.items[idx].status || 'pending';
                                                        return ['pending', 'preparing'].includes(s);
                                                    }) && (
                                                            <button
                                                                onClick={() => handleBulkItemStatusUpdate('ready')}
                                                                className="flex-1 bg-green-500 text-white py-3 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] transition-all text-sm sm:text-lg font-normal shadow-lg hover:shadow-xl active:scale-[0.98] outline-none"
                                                            >
                                                                Mark Ready ({selectedItems.length})
                                                            </button>
                                                        )}
                                                    {selectedItems.every(idx => {
                                                        const s = selectedOrder.items[idx].status || 'pending';
                                                        return ['ready'].includes(s);
                                                    }) && (
                                                            <button
                                                                onClick={() => handleBulkItemStatusUpdate('completed')}
                                                                className="flex-1 bg-blue-500 text-white py-3 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] transition-all text-sm sm:text-lg font-normal shadow-lg hover:shadow-xl active:scale-[0.98] outline-none"
                                                            >
                                                                Mark Completed ({selectedItems.length})
                                                            </button>
                                                        )}
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const nextStatus = selectedOrder?.status === 'ready' ? 'completed' : getNextStatus(selectedOrder?.status);
                                                        updateOrderStatus(selectedOrder?._id, nextStatus);
                                                        setSelectedOrder(null);
                                                    }}
                                                    className={`flex-1 ${selectedOrder?.status === 'ready' ? 'bg-[#FD6941]' : getStatusButtonColor(selectedOrder?.status)} text-white py-3 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] transition-all text-sm sm:text-lg font-normal shadow-lg hover:shadow-xl active:scale-[0.98] outline-none`}
                                                >
                                                    {selectedOrder?.status === 'ready' ? 'Complete Order' : getNextStatusLabel(selectedOrder?.status)}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )
            }
        </div >
    );
};

export default AdminOrders;
