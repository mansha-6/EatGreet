import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Download, Calendar, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { paymentAPI, statsAPI } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import EatGreetLogo from '../../assets/logo-full.png';

// Custom Date Range Picker Component (Same as AdminSales for consistency)
const DateRangePicker = ({ range, onChange, onClose }) => {
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

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
        const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: clickedDate, end: null });
        } else {
            if (clickedDate.getTime() >= selection.start.getTime()) {
                setSelection({ ...selection, end: clickedDate });
            } else {
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
        now.setHours(0, 0, 0, 0);
        let start, end = new Date(now);
        switch (type) {
            case 'today': start = new Date(now); break;
            case 'yesterday': start = new Date(now); start.setDate(now.getDate() - 1); end = new Date(start); break;
            case 'week': start = new Date(now); start.setDate(now.getDate() - 7); break;
            case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
            default: start = null;
        }
        if (start) {
            onChange({ start: toLocalDateString(start), end: toLocalDateString(end) });
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-[400px] rounded-[2.5rem] shadow-2xl border border-white/50 p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-normal text-black">Select Range</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {['today', 'yesterday', 'week', 'month'].map(p => (
                        <button key={p} onClick={() => setPreset(p)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-xs capitalize">{p}</button>
                    ))}
                </div>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-2"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="font-normal">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-2"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="h-8 flex items-center justify-center text-[10px] text-gray-300 font-bold">{d}</div>)}
                    {Array.from({ length: firstDayOfMonth(viewDate) }).map((_, i) => <div key={i} />)}
                    {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
                        const day = i + 1;
                        const active = isSelected(day);
                        const range = isInRange(day);
                        return (
                            <button key={day} onClick={() => handleDateClick(day)} className={`h-10 w-10 flex items-center justify-center rounded-full text-sm transition-all ${active ? 'bg-[#FD6941] text-white' : range ? 'bg-[#FFF5F1] text-[#FD6941]' : 'hover:bg-gray-50'}`}>
                                {day}
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-3">
                    <button onClick={clearSelection} className="flex-1 py-4 bg-gray-50 rounded-2xl text-sm flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" />Clear</button>
                    <button onClick={applySelection} className="flex-[2] py-4 bg-[#FD6941] text-white rounded-2xl text-sm shadow-lg">Apply</button>
                </div>
            </div>
        </div>
    );
};

export default function Payments() {
    const { currencySymbol } = useSettings();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingAmount: 0,
        activeSubscriptions: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [revenueData, setRevenueData] = useState([]); // For growth graph in PDF

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = {
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            };
            const [paymentsRes, statsRes] = await Promise.all([
                paymentAPI.getAll(params),
                statsAPI.getSuperAdminStats(params)
            ]);

            setTransactions(paymentsRes.data.transactions);
            setStats({
                totalRevenue: paymentsRes.data.stats.totalRevenue,
                pendingAmount: paymentsRes.data.stats.pendingAmount,
                activeSubscriptions: statsRes.data.activeSubscriptions
            });
            setRevenueData(statsRes.data.revenueData);
        } catch (error) {
            console.error("Failed to load payment data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('newPayment', (data) => {
            console.log('New payment received:', data);
            toast.success(`New payment received from ${data.restaurantName}!`, {
                icon: '💰',
                duration: 5000
            });
            fetchData();
        });

        return () => {
            socket.off('newPayment');
        };
    }, [socket]);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const handleDownloadPDF = async () => {
        const toastId = toast.loading('Generating Super Admin Report...');
        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);
            const doc = new jsPDF();
            const brandOrange = [253, 105, 65];
            const textDark = [30, 30, 30];
            const textGray = [100, 100, 100];

            // Header line
            doc.setFillColor(...brandOrange);
            doc.rect(0, 0, 210, 4, 'F');

            // Logo & Title
            doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(...textDark).text("EatGreet System Report", 15, 25);
            doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(...textGray).text(`Generated: ${new Date().toLocaleString()}`, 15, 32);
            if (dateRange.start) doc.text(`Period: ${dateRange.start} to ${dateRange.end || 'Today'}`, 15, 37);

            // Summary Section
            doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(...textDark).text("Subscription Growth & Packages", 15, 52);
            const summaryTable = [
                ['Active Users', 'Total Revenue Collected', 'Pending/Overdue'],
                [stats.activeSubscriptions.toLocaleString(), `${currencySymbol}${stats.totalRevenue.toLocaleString()}`, `${currencySymbol}${stats.pendingAmount.toLocaleString()}`]
            ];
            autoTable(doc, {
                startY: 57, body: summaryTable, theme: 'grid', styles: { halign: 'center', cellPadding: 5 }
            });

            // Growth Data (Interactive Graph data represented as a table)
            let yGrowth = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14).setFont("helvetica", "bold").text("Monthly Subscription Growth", 15, yGrowth);
            const growthTable = [
                ['Month', ...revenueData.map(d => d.name)],
                ['Revenue', ...revenueData.map(d => `${currencySymbol}${d.value}`)]
            ];
            autoTable(doc, {
                startY: yGrowth + 5, body: growthTable, theme: 'grid', styles: { fontSize: 8 }
            });

            // Payments Listing
            let yTxn = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14).setFont("helvetica", "bold").text("User Transaction Record", 15, yTxn);
            const txnRows = transactions.map(t => [
                t.transactionId,
                t.restaurant?.name || 'Unknown',
                new Date(t.date).toLocaleDateString(),
                t.method,
                `${currencySymbol}${t.amount}`,
                t.status
            ]);
            autoTable(doc, {
                startY: yTxn + 5,
                head: [['TXN ID', 'User / Business', 'Date', 'Method', 'Amount', 'Status']],
                body: txnRows,
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] }
            });

            doc.save(`SuperAdmin_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report downloaded', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF', { id: toastId });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
        });
    };

    return (
        <div className="flex-1 min-h-0 w-full bg-[#F0F2F4] px-4 md:px-10 py-6 flex flex-col overflow-hidden">
            <div className="max-w-[1850px] mx-auto w-full flex-1 flex flex-col space-y-6 min-h-0">
                {/* Header */}
                <div className="flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-3xl font-normal text-gray-900">Payments</h1>
                        <p className="text-gray-500 font-normal text-sm mt-1">Track revenue and subscription payments.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="bg-white border border-gray-200 text-gray-600 hover:text-black hover:border-gray-400 p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-sm text-sm overflow-hidden h-10 w-10 sm:h-[52px] sm:w-[52px] sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2"
                        >
                            <Calendar className="w-5 h-5 sm:w-5 sm:h-5 shrink-0 text-[#FD6941]" />
                            <span className="max-w-0 opacity-0 group-hover:max-w-[180px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
                                {dateRange.start ? `${dateRange.start} - ${dateRange.end || 'Now'}` : 'All Time'}
                            </span>
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="bg-[#FD6941] hover:bg-[#FD6941]/90 text-white p-2.5 sm:p-3 rounded-full font-normal flex items-center justify-center gap-0 group transition-all duration-300 shadow-lg text-sm overflow-hidden h-10 w-10 sm:h-[52px] sm:w-[52px] sm:hover:w-auto sm:hover:px-6 sm:hover:gap-2 active:scale-95"
                        >
                            <Download className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" />
                            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden hidden sm:block">
                                Export Report
                            </span>
                        </button>
                    </div>
                </div>

                {isDatePickerOpen && (
                    <DateRangePicker
                        range={dateRange}
                        onChange={setDateRange}
                        onClose={() => setIsDatePickerOpen(false)}
                    />
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm font-normal">Total Revenue</span>
                            <div className="p-2 bg-green-50 text-green-600 rounded-full"><DollarSign className="w-5 h-5" /></div>
                        </div>
                        <h3 className="text-3xl font-normal text-gray-900">{currencySymbol}{stats.totalRevenue.toLocaleString()}</h3>
                        <p className="text-green-600 text-xs font-normal mt-2 flex items-center gap-1">↑ 12.5% <span className="text-gray-400 font-normal">vs last month</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm font-normal">Pending</span>
                            <div className="p-2 bg-[#FD6941] text-white rounded-full"><Calendar className="w-5 h-5" /></div>
                        </div>
                        <h3 className="text-3xl font-normal text-gray-900">{currencySymbol}{stats.pendingAmount.toLocaleString()}</h3>
                        <p className="text-[#FD6941] text-xs font-normal mt-2">Due this week</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm font-normal">Subscriptions</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><CreditCard className="w-5 h-5" /></div>
                        </div>
                        <h3 className="text-3xl font-normal text-gray-900">{stats.activeSubscriptions}</h3>
                        <p className="text-blue-600 text-xs font-normal mt-2 flex items-center gap-1">Active Accounts</p>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <h3 className="font-normal text-gray-800">Recent Transactions</h3>
                    </div>
                    <div className="overflow-y-auto no-scrollbar flex-1">
                        <table className="w-full">
                            <thead className="bg-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-normal text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-normal text-gray-400 uppercase tracking-wider">User / Business</th>
                                    <th className="px-6 py-4 text-left text-xs font-normal text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-normal text-gray-400 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-right text-xs font-normal text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-center text-xs font-normal text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">Loading transactions...</td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No transactions found</td>
                                    </tr>
                                ) : (
                                    transactions.map((txn, idx) => (
                                        <motion.tr
                                            key={txn._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-normal text-gray-500">{txn.transactionId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-normal text-gray-900 text-sm">{txn.restaurant?.name || 'Unknown User'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-500 font-normal">{formatDate(txn.date)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-4 rounded bg-gray-200"></div>
                                                    <span className="text-xs text-gray-600 font-normal">{txn.method}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-normal text-gray-900">{currencySymbol}{txn.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-wide border ${txn.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    txn.status === 'Pending' ? 'bg-[#FD6941]/10 text-[#FD6941] border-[#FD6941]/20' :
                                                        'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
