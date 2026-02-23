import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { orderAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { Check, Clock, Utensils } from 'lucide-react';

export default function KitchenDashboard() {
    const { restaurantName } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    // Fetch initial orders
    useEffect(() => {
        if (!restaurantName) return;

        const fetchOrders = async () => {
            try {
                const response = await orderAPI.getKitchenOrders(restaurantName);
                const active = response.data.filter(o => ['pending', 'preparing'].includes(o.status));
                setOrders(active);
            } catch (error) {
                console.error("Failed to fetch orders", error);
                toast.error("Failed to load orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [restaurantName]);

    // Socket Listener
    useEffect(() => {
        if (!socket || !restaurantName) return;
        socket.emit('joinRestaurant', restaurantName);

        const handleOrderUpdate = (payload) => {
            const { action, data } = payload;
            if (!data) return;

            if (action === 'create') {
                if (['pending', 'preparing'].includes(data.status)) {
                    setOrders(prev => {
                        if (prev.find(o => o._id === data._id)) return prev;
                        return [data, ...prev];
                    });
                    toast.success(`Order #${data.dailySequence ? String(data.dailySequence).padStart(3, '0') : data._id.slice(-4).toUpperCase()} received!`);
                }
            }
            else if (action === 'update') {
                setOrders(prev => {
                    if (!['pending', 'preparing'].includes(data.status)) {
                        return prev.filter(o => o._id !== data._id);
                    }
                    const exists = prev.find(o => o._id === data._id);
                    if (exists) {
                        return prev.map(o => o._id === data._id ? data : o);
                    } else {
                        // If it's a pending/preparing order we didn't have, add it
                        return [data, ...prev];
                    }
                });
            }
        };

        socket.on('orderUpdated', handleOrderUpdate);
        return () => socket.off('orderUpdated', handleOrderUpdate);
    }, [socket, restaurantName]);

    const handleStatusUpdate = async (orderId, itemIndices, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'preparing' : 'ready';

        // Optimistic Update: Update local state immediately
        const previousOrders = [...orders];
        setOrders(prev => prev.map(order => {
            if (order._id !== orderId) return order;

            const updatedItems = [...order.items];
            itemIndices.forEach(idx => {
                updatedItems[idx] = { ...updatedItems[idx], status: newStatus };
            });

            return { ...order, items: updatedItems };
        }));

        try {
            const loadToast = toast.loading(`Updating to ${newStatus}...`);

            if (itemIndices && itemIndices.length > 0) {
                await Promise.all(itemIndices.map(idx =>
                    orderAPI.updateItemStatus(orderId, idx, newStatus)
                ));
            } else {
                await orderAPI.updateKitchenOrderStatus(restaurantName, orderId, newStatus);
            }

            toast.success(`Items updated to ${newStatus}`, { id: loadToast });
        } catch (error) {
            console.error("Status update failed", error);
            toast.error("Status update failed - reverting change");
            // Rollback to previous state on error
            setOrders(previousOrders);
        }
    };

    // Group items by their addedAt timestamp into separate cards
    const groupedRounds = orders.flatMap(order => {
        const rounds = {};

        order.items.forEach((item, idx) => {
            if (['ready', 'served', 'completed'].includes(item.status)) return;

            // Group by item's addedAt, fall back to order's createdAt
            const timeKey = item.addedAt ? new Date(item.addedAt).getTime() : new Date(order.createdAt).getTime();

            // Allow a small 10s window for items added in the same "burst"
            const matchedKey = Object.keys(rounds).find(k => Math.abs(k - timeKey) < 10000);
            const finalKey = matchedKey || timeKey;

            if (!rounds[finalKey]) rounds[finalKey] = [];
            rounds[finalKey].push({ ...item, originalIndex: idx });
        });

        return Object.entries(rounds).map(([time, items], index) => ({
            ...order,
            items,
            roundKey: `${order._id}_${time}`,
            roundSequence: index + 1,
            timeLabel: new Date(parseInt(time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            allPending: items.every(it => it.status === 'pending'),
            allPreparing: items.every(it => it.status === 'preparing'),
            status: items.every(it => it.status === 'preparing') ? 'preparing' : 'pending'
        }));
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.roundSequence - b.roundSequence);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Clock className="w-10 h-10 text-gray-200 animate-spin mb-4" />
            <p className="text-gray-400 font-normal">Getting kitchen ready...</p>
        </div>
    );

    return (
        <div className="w-full pb-6 sm:pb-12">
            <div className="space-y-1 mb-6">
                <h1 className="text-[20px] sm:text-[24px] lg:text-[28px] font-normal text-black tracking-tight leading-none">Kitchen Dashboard</h1>
                <p className="text-[11px] sm:text-[13px] lg:text-[14px] text-gray-400 font-normal uppercase tracking-widest opacity-60">Manage incoming and active preparation orders</p>
            </div>

            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.8rem] p-4 sm:p-8 relative shadow-sm min-h-[70vh] sm:min-h-[80vh] border border-transparent">
                <div className="mb-6 flex justify-between items-center px-2">
                    <h2 className="text-[14px] sm:text-[20px] lg:text-[24px] font-normal text-black leading-tight">Active Orders</h2>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <span className="w-1.5 h-1.5 bg-[#FD6941] rounded-full animate-pulse"></span>
                        <span className="text-[10px] sm:text-[12px] font-normal uppercase tracking-wider text-gray-400 opacity-60">{groupedRounds.length} Orders</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {groupedRounds.map((round) => (
                            <motion.div
                                key={round.roundKey}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => handleStatusUpdate(round._id, round.items.map(it => it.originalIndex), round.status)}
                                className={`bg-[#F9FAFB] rounded-[1.5rem] sm:rounded-[2.2rem] p-6 sm:p-9 flex flex-col relative group cursor-pointer overflow-hidden border border-gray-50 transition-all duration-300 shadow-sm hover:shadow-md min-h-[380px] sm:min-h-[460px] ${round.status === 'preparing'
                                    ? 'border-[#FD6941]/20 bg-white'
                                    : 'hover:border-gray-100'
                                    }`}
                            >
                                {/* Order ID Header */}
                                <div className="mb-5 sm:mb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-[20px] sm:text-[26px] font-normal text-black leading-tight">Order #{round.dailySequence ? String(round.dailySequence).padStart(3, '0') : round._id.slice(-4).toUpperCase()}</h3>
                                            <p className="text-[12px] sm:text-[14px] text-gray-400 font-normal uppercase tracking-[0.1em] opacity-60 mt-1">Table {round.tableNumber}</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-normal uppercase tracking-widest shadow-sm ${round.roundSequence > 1 ? 'bg-blue-50 text-blue-600 border border-blue-50' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                            {round.roundSequence > 1 ? `Round ${round.roundSequence}` : 'Fresh'}
                                        </div>
                                    </div>
                                    <div className="h-[1px] bg-gray-100 mt-5 w-full"></div>
                                </div>

                                {/* Items Table Area */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <span className="text-[10px] sm:text-[12px] text-gray-400 font-normal uppercase tracking-wider opacity-60">Prep Items</span>
                                        <span className="text-[10px] sm:text-[12px] text-gray-400 font-normal uppercase tracking-wider opacity-60">Qty</span>
                                    </div>

                                    <ul className="space-y-4">
                                        {round.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-center group/item px-1">
                                                <div className="flex flex-col">
                                                    <span className={`text-[15px] sm:text-[18px] font-normal leading-tight ${round.status === 'preparing' ? 'text-black' : 'text-gray-500'}`}>{item.name}</span>
                                                    {item.status === 'ready' && <span className="text-[10px] text-green-500 font-normal uppercase tracking-wider mt-1">Ready</span>}
                                                </div>
                                                <span className="text-[15px] sm:text-[18px] font-normal text-black bg-white w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full shadow-sm border border-gray-50">{item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Cooking Instructions Divider & Section */}
                                <div className="mt-4 sm:mt-6 bg-[#F3F5F7] -mx-4 sm:-mx-6 p-3 sm:p-4 rounded-[1rem] border border-gray-50/50">
                                    <div className="px-1 flex flex-col gap-1.5">
                                        <h4 className="text-[10px] font-normal text-gray-400 uppercase tracking-wider opacity-60">Instructions</h4>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[11px] sm:text-[13px] text-gray-500 leading-snug font-normal italic tracking-tight">
                                                "{round.instruction || "Standard prep requested"}"
                                            </p>
                                            <div className="text-right ml-2 shrink-0">
                                                <span className="text-[9px] sm:text-[10px] font-normal text-gray-400 bg-white px-1.5 py-0.5 rounded-md border border-gray-50">{round.timeLabel}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Pulse Badge (Always Visible when preparing) */}
                                {round.status === 'preparing' && (
                                    <div className="absolute top-6 right-8 flex items-center gap-2 bg-[#FD6941] px-4 py-2 rounded-full shadow-lg shadow-[#FD6941]/10 border border-white/20 backdrop-blur-sm">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-normal text-white uppercase tracking-widest">Live</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {orders.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-32">
                            <div className="w-24 h-24 bg-[#F8F8F8] rounded-full flex items-center justify-center mb-6 text-gray-300 shadow-inner">
                                <Check size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No active orders</h3>
                            <p className="text-gray-400 font-normal">The kitchen is all caught up!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
