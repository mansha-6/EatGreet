import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import activityIcon from '../../assets/activity.svg';
import revenueIcon from '../../assets/trending-up.svg';
import { statsAPI, orderAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';

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

// --- COMPONENTS ---

const DashboardCard = ({ value, label, icon, subValue, isCurrency }) => {
    const { currencySymbol } = useSettings();
    return (
        <div className="bg-white rounded-[1.2rem] sm:rounded-[2rem] px-4 sm:px-6 py-3 sm:py-4 flex items-center h-[100px] sm:h-[140px] shadow-sm relative border border-transparent hover:border-gray-50 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F3F3F3] rounded-full flex items-center justify-center shrink-0 text-black/80">
                    {typeof icon === 'string' ? (
                        <img src={icon} alt="icon" className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
                    ) : (
                        React.createElement(icon, { className: "w-5 h-5 sm:w-6 sm:h-6" })
                    )}
                </div>
                <div className="flex flex-col">
                    <h3 className="text-[18px] sm:text-[28px] lg:text-[32px] font-normal text-black leading-none flex items-baseline">
                        {isCurrency && <span className="text-[14px] sm:text-[20px] lg:text-[24px] mr-1 font-normal">{currencySymbol}</span>}
                        {value}
                        {subValue !== undefined && (
                            <span className="text-[12px] sm:text-[20px] lg:text-[24px] text-gray-400 opacity-30 font-normal ml-1">
                                /{subValue}
                            </span>
                        )}
                    </h3>
                    <p className="text-[11px] sm:text-[13px] lg:text-[14px] text-gray-400 mt-1 sm:mt-2 font-normal tracking-tight truncate max-w-[100px] sm:max-w-full">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
};

const TimeStatusGauge = ({ value }) => {
    // Determine percentage (assume 45 mins is max for full gauge)
    const maxVal = 45;
    const percent = Math.min(Math.max((value || 0), 0) / maxVal, 1);

    // Config
    const numTicks = 42;
    const cx = 180;
    const cy = 210;
    const rInner = 130;
    const rOuter = 170;

    // Calculate active ticks
    const activeCount = Math.round(percent * numTicks);

    return (
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 h-[300px] sm:h-[320px] shadow-sm flex flex-col relative overflow-hidden transition-all border border-transparent">
            <h3 className="text-[14px] sm:text-[20px] lg:text-[24px] font-normal text-black mb-1">Time Status</h3>

            <div className="flex-1 flex items-center justify-center relative translate-y-[-10px]">
                <svg width="100%" height="240" viewBox="0 0 360 230" className="overflow-visible">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FACC15" />
                            <stop offset="100%" stopColor="#22C55E" />
                        </linearGradient>
                    </defs>

                    {Array.from({ length: numTicks }).map((_, i) => {
                        // Create symmetrical arc from -180 deg to 0 deg
                        const startAngle = -180;
                        const endAngle = 0;
                        const angle = startAngle + (i * (endAngle - startAngle) / (numTicks - 1));
                        const rad = (angle * Math.PI) / 180;

                        const x1 = cx + rInner * Math.cos(rad);
                        const y1 = cy + rInner * Math.sin(rad);
                        const x2 = cx + rOuter * Math.cos(rad);
                        const y2 = cy + rOuter * Math.sin(rad);

                        const isActive = i < activeCount;

                        return (
                            <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isActive ? "url(#gaugeGradient)" : "#F3F5F7"}
                                strokeWidth="10"
                                strokeLinecap="round"
                                className={isActive ? "animate-live-pulse" : ""}
                                style={{
                                    animationDelay: `${i * 0.03}s` // Live ripple effect
                                }}
                            />
                        );
                    })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-24">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[40px] sm:text-[56px] font-normal text-black tracking-tight leading-none">
                            {value || 0}
                        </span>
                        <span className="text-[20px] sm:text-[28px] font-normal text-black">min</span>
                    </div>
                    <span className="text-[12px] sm:text-[16px] text-gray-400 font-normal mt-1">Avg. Wait Time</span>
                </div>
            </div>

            <style>{`
                @keyframes live-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-live-pulse {
                    animation: live-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

const CustomPillBar = (props) => {
    const { x, y, width, height, highlight } = props;
    const pillWidth = Math.min(width * 0.8, 46);
    const radius = pillWidth / 2;

    // In the reference image, bars have different heights/positions
    // For our data, we'll keep it simple but match the pill look
    const barHeight = height > 0 ? height : 4;

    return (
        <g>
            <defs>
                <linearGradient id="pillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#86EFAC" stopOpacity={0.3} />
                </linearGradient>
            </defs>
            {/* Background vertical line for highlighted day (matches image) */}
            {highlight && (
                <line
                    x1={x + width / 2}
                    y1={0}
                    x2={x + width / 2}
                    y2={600}
                    stroke="#22C55E"
                    strokeWidth="2"
                    strokeDasharray="0"
                />
            )}

            {/* Main Pill Bar */}
            <rect
                x={x + (width - pillWidth) / 2}
                y={y}
                width={pillWidth}
                height={barHeight}
                rx={radius}
                fill={highlight ? "url(#pillGradient)" : "#F1F5F9"}
                className="transition-all duration-300"
            />

            {/* Artistic dots like the image if highlighted */}
            {highlight && height > 40 && (
                <circle cx={x + width / 2} cy={y + 10} r="4" fill="white" fillOpacity="0.5" />
            )}
        </g>
    );
};



const AdminDashboard = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const { user, currencySymbol } = useSettings();
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeOrders: 0,
        dineIn: 0,
        todayRevenue: 0,
        totalTables: 0,
        revenue: 0
    });
    const [salesData, setSalesData] = useState([]);
    const [feedItems, setFeedItems] = useState([]);

    const fetchDashboardData = React.useCallback(async () => {
        try {
            // Fetch stats and orders in parallel for better performance
            const [statsRes, ordersRes] = await Promise.all([
                statsAPI.getAdminStats(),
                orderAPI.getOrders({ status: 'pending,preparing,ready', limit: 100 })
            ]);

            // 3. Robust Total Tables count
            const savedTables = localStorage.getItem('admin_tables');
            let trackedTables = [1, 2, 3, 4, 5, 6]; // Default fallback
            if (savedTables) {
                try {
                    const parsed = JSON.parse(savedTables);
                    if (Array.isArray(parsed)) trackedTables = parsed;
                } catch { /* ignore */ }
            }

            // 4. Calculate Occupied Count Locally for 100% Accuracy with the UI
            const orders = ordersRes.data || [];
            const occupiedTableNumbers = new Set(
                orders
                    .filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
                    .map(o => String(o.tableNumber))
                    .filter(tNo => trackedTables.map(String).includes(tNo))
            );

            // 5. Calculate Real Avg Wait Time (for active orders)
            const activeOrdersForTime = orders.filter(o => ['pending', 'preparing'].includes(o.status));
            let calculatedWaitTime = 0;

            if (activeOrdersForTime.length > 0) {
                const now = new Date();
                const totalTimeMs = activeOrdersForTime.reduce((acc, order) => {
                    return acc + (now - new Date(order.createdAt));
                }, 0);
                calculatedWaitTime = Math.round(totalTimeMs / (1000 * 60) / activeOrdersForTime.length);
            }

            // If no active orders, wait time is 0.
            // If active orders exist, show their average wait time.
            const finalWaitTime = calculatedWaitTime > 0
                ? calculatedWaitTime
                : (activeOrdersForTime.length > 0 ? 1 : 0); // If pending but <1 min, show 1. If no orders, show 0.

            setStats({
                activeOrders: statsRes.data.summary?.activeOrders || 0,
                todayRevenue: statsRes.data.summary?.rangeRevenue || 0,
                totalRevenue: statsRes.data.summary?.totalRevenue || 0,
                dineIn: occupiedTableNumbers.size,
                totalTables: trackedTables.length,
                avgWaitTime: finalWaitTime
            });

            // Process Feed
            const activeOrdersList = orders
                .filter(o => o.status && ['pending', 'preparing', 'ready'].includes(o.status))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3)
                .map(o => ({
                    id: o._id,
                    title: `Order #${(() => { const d = new Date(o.createdAt); return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(-2)}${o.dailySequence ? String(o.dailySequence).padStart(2, '0') : o._id.slice(-2).toUpperCase()}`; })()}`,
                    sub: (o.items || []).map(i => i.name || 'Item').join(', '),
                    icon: UserIcon
                }));
            setFeedItems(activeOrdersList);

            // Process Hourly Revenue Data (Today)
            const hourlyData = statsRes.data.charts?.hourlyAnalysis || [];
            const graphData = [];

            // Create array for hours 0-23
            for (let i = 0; i < 24; i++) {
                const hourLabel = i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`;
                const hourData = hourlyData.find(h => h._id === i);

                graphData.push({
                    name: hourLabel,
                    value: hourData ? hourData.totalSales : 0,
                    hourIndex: i // Add index for filtering
                });
            }

            // Dynamic 7-hour window Logic: [Current-3, Current, Current+3]
            const currentHour = new Date().getHours();
            let startHour = currentHour - 3;
            let endHour = currentHour + 3;

            // Adjust window if out of bounds (0-23)
            if (startHour < 0) {
                startHour = 0;
                endHour = 6; // Fixed 7-hour window at start of day
            } else if (endHour > 23) {
                endHour = 23;
                startHour = 17; // Fixed 7-hour window at end of day
            }

            const filteredGraphData = graphData.filter(d => d.hourIndex >= startHour && d.hourIndex <= endHour);
            setSalesData(filteredGraphData);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Socket Listener for Real-Time Stats Update
    useEffect(() => {
        if (!socket || !user?.restaurantName) return;

        socket.emit('joinRestaurant', user.restaurantName);

        const handleUpdate = () => {
            console.log("Dashboard update triggered by socket");
            fetchDashboardData();
        };

        socket.on('orderUpdated', handleUpdate);
        return () => socket.off('orderUpdated');
    }, [socket, user?.restaurantName, fetchDashboardData]);

    const restaurantSlug = user?.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';

    return (
        <div className="min-h-screen bg-transparent px-2 sm:px-4 pt-0 pb-4 sm:pt-0 sm:pb-8 space-y-4 md:space-y-6">
            <div className="space-y-1">
                <h1 className="text-[20px] sm:text-[24px] lg:text-[28px] font-normal text-black tracking-tight leading-none">Dashboard</h1>
                <p className="text-[11px] sm:text-[13px] lg:text-[14px] text-gray-400 font-normal uppercase tracking-widest opacity-60">Welcome back, Admin</p>
            </div>

            {/* Main Content Grid - 1 Column on Mobile, 12 on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                {/* Left Column (Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                    {/* Top Row: KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <DashboardCard value={stats.activeOrders || 0} label="Active Orders" icon={activityIcon} />
                        <DashboardCard
                            value={stats.dineIn || 0}
                            subValue={stats.totalTables || 0}
                            label="Occupied Tables"
                            icon={TableIcon}
                        />
                        <DashboardCard value={(stats.todayRevenue || 0).toLocaleString()} label="Today Revenue" icon={revenueIcon} isCurrency />
                    </div>

                    {/* Middle Row: Sales Analytics */}
                    <div className="bg-white rounded-[1.5rem] sm:rounded-[2.8rem] p-4 sm:p-8 relative shadow-sm h-[400px] sm:h-[600px] lg:h-[740px] flex flex-col border border-transparent">
                        <div className="flex justify-between items-center gap-2 mb-4 sm:mb-2">
                            <div
                                className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/${restaurantSlug}/admin/sales`)}
                            >
                                <h2 className="text-[14px] sm:text-[20px] lg:text-[24px] font-normal text-black leading-tight">Sales Analytics</h2>
                                <p className="text-[11px] sm:text-[13px] text-gray-400 font-normal uppercase tracking-wider opacity-60">Today Breakdown</p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                    onClick={() => navigate(`/${restaurantSlug}/admin/sales`)}
                                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={salesData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500, fontFamily: 'Urbanist' }}
                                        dy={15}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={false}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white px-3 py-1.5 rounded-lg shadow-xl border border-gray-100">
                                                        <p className="text-[13px] font-medium text-black">
                                                            {currencySymbol}{payload[0].value.toLocaleString()}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        shape={(props) => <CustomPillBar {...props} />}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column (Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
                    {/* Time Status Gauge */}
                    <div className="block">
                        <TimeStatusGauge value={stats.avgWaitTime || 0} />
                    </div>

                    {/* Live Active Feed */}
                    <div className="bg-white rounded-[1.5rem] sm:rounded-[2.8rem] p-4 sm:p-8 shadow-sm flex flex-col h-[400px] sm:h-[500px] lg:h-[560px] border border-transparent">
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h2 className="text-[14px] sm:text-[20px] lg:text-[24px] font-normal text-black leading-tight">Live Feed</h2>
                            <div
                                onClick={() => navigate(`/${restaurantSlug}/admin/orders`)}
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            </div>
                        </div>

                        <div className="space-y-3 sm:space-y-6 flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar no-scrollbar">
                            {feedItems.length > 0 ? feedItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(`/${restaurantSlug}/admin/orders?orderId=${item.id}`)}
                                    className="flex items-center justify-between p-3 sm:p-5 bg-[#F9FAFB] rounded-[1.2rem] sm:rounded-[2.2rem] border border-gray-50 hover:bg-white hover:border-gray-100 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 sm:gap-5">
                                        <div className="w-12 h-12 sm:w-[72px] sm:h-[72px] rounded-full bg-[#F3F5F7] flex items-center justify-center shrink-0 group-hover:bg-white transition-colors text-black/70">
                                            {typeof item.icon === 'string' ? (
                                                <img src={item.icon} alt={item.title} className="w-6 h-6 sm:w-9 sm:h-9 opacity-70" />
                                            ) : (
                                                React.createElement(item.icon, { className: "w-6 h-6 sm:w-9 sm:h-9" })
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-normal text-black text-[14px] sm:text-[17px] leading-tight">{item.title}</h4>
                                            <p className="text-[11px] sm:text-[14px] text-gray-400 font-normal mt-0.5 truncate max-w-[100px] sm:max-w-[120px]">{item.sub}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/${restaurantSlug}/admin/orders?orderId=${item.id}`); }}
                                        className="bg-black text-white text-[11px] sm:text-[13px] font-normal px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-gray-800 transition-transform active:scale-95"
                                    >
                                        View
                                    </button>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                    <p>No active orders</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AdminDashboard;

