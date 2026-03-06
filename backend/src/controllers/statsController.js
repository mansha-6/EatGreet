const getAdminStats = async (req, res) => {
    try {
        const { Order, MenuItem } = req.tenantModels;
        const { startDate, endDate } = req.query;

        // 1. Determine Date Range
        const now = new Date();
        let start = null;
        let end = null;

        if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        }
        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        // Shared Filter for Date-based queries
        const salesStatus = ['ready', 'completed', 'served', 'prepared'];
        const volumeStatus = ['pending', 'preparing', 'prepared', 'ready', 'served', 'completed'];

        const dateFilter = {};
        if (start || end) {
            dateFilter.updatedAt = {};
            if (start) dateFilter.updatedAt.$gte = start;
            if (end) dateFilter.updatedAt.$lte = end;
        }

        const financialsFilter = { ...dateFilter, status: { $in: salesStatus } };
        const volumeFilter = { ...dateFilter, status: { $in: volumeStatus } };

        // 2. Calculate Occupied Tables (Live status)
        const occupiedTablesResult = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['pending', 'preparing', 'ready', 'served'] },
                    tableNumber: { $regex: /^[0-9]+$/ }
                }
            },
            { $group: { _id: "$tableNumber" } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]);
        const dineInCount = occupiedTablesResult.length > 0 ? occupiedTablesResult[0].count : 0;

        // 3. Parallel Stats Fetching
        const isFiltered = !!(start || end);
        const [
            totalOrders,
            activeOrders,
            rangeRevenueData,
            totalRevenueData,
            trendRevenueData,
            hourlyRevenueData,
            bestsellersData,
            allTimeOrdersCount,
            yearlyStatsData
        ] = await Promise.all([
            Order.countDocuments(volumeFilter),
            Order.countDocuments({ status: { $in: ['pending', 'preparing', 'ready', 'served'] } }),
            Order.aggregate([
                { $match: financialsFilter },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.aggregate([
                { $match: { status: { $in: salesStatus } } },
                { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
            ]),
            Order.aggregate([
                { $match: volumeFilter },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: isFiltered ? "%Y-%m-%d" : "%Y-%m",
                                date: "$updatedAt",
                                timezone: "Asia/Kolkata"
                            }
                        },
                        // Revenue: Only if status is in salesStatus
                        total: {
                            $sum: {
                                $cond: [
                                    { $in: ["$status", salesStatus] },
                                    "$totalAmount",
                                    0
                                ]
                            }
                        },
                        // Volume: All matches (volumeStatus)
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Order.aggregate([
                { $match: financialsFilter },
                {
                    $group: {
                        _id: { $hour: { date: "$updatedAt", timezone: "Asia/Kolkata" } },
                        total: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Order.aggregate([
                { $match: financialsFilter },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.menuItem",
                        name: { $first: "$items.name" },
                        count: { $sum: "$items.quantity" },
                        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Order.countDocuments({ status: { $in: volumeStatus } }),
            Order.aggregate([
                {
                    $match: {
                        status: { $in: salesStatus },
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const rangeRevenue = rangeRevenueData.length > 0 ? rangeRevenueData[0].total : 0;
        const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

        // Calculate All-Time AOV
        const allTimeOrders = allTimeOrdersCount || 0;
        const avgOrderValue = allTimeOrders > 0 ? totalRevenue / allTimeOrders : 0;

        // Yearly Stats
        const yearlyRevenue = yearlyStatsData.length > 0 ? yearlyStatsData[0].totalRevenue : 0;
        const yearlyEBITDA = yearlyRevenue * 0.30; // Estimated 30% margin

        // Calculate Cancellation Rate
        const cancelledOrders = await Order.countDocuments({
            status: 'cancelled',
            ...(start || end ? { createdAt: { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) } } : {})
        });
        const cancellationRate = totalOrders > 0 ? (cancelledOrders / (totalOrders + cancelledOrders)) * 100 : 0;

        const totalTables = req.user?.restaurantDetails?.totalTables || 0;

        res.json({
            summary: {
                totalOrders,
                activeOrders,
                totalRevenue,
                rangeRevenue,
                avgOrderValue,
                allTimeOrders,
                yearlyRevenue,
                yearlyEBITDA,
                cancellationRate,
                dineIn: dineInCount,
                totalTables,
                takeaway: totalOrders - dineInCount,
            },
            charts: {
                revenueTrend: trendRevenueData,
                hourlyAnalysis: hourlyRevenueData,
                bestsellers: bestsellersData
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuperAdminStats = async (req, res) => {
    try {
        const User = require('../models/User');

        // 1. Basic Counts
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalCustomers = await User.countDocuments({ role: 'customer' });

        const activeRestaurants = await User.countDocuments({
            role: 'admin',
            'restaurantDetails.isActive': true
        });

        const pendingApprovals = await User.countDocuments({
            role: 'admin',
            isApproved: false
        });

        // 2. Financials (Aggregated from all user payments)
        const totalRevenueResult = await User.aggregate([
            { $unwind: "$payments" },
            { $match: { "payments.status": "Completed" } },
            { $group: { _id: null, total: { $sum: "$payments.amount" } } }
        ]);
        const platformTotalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        // Current Monthly Subscription MRR (Estimated from Active Tiers)
        const activeSubscribers = await User.find({
            role: 'admin',
            'subscription.status': 'Active'
        });

        const estimatedMRR = activeSubscribers.reduce((acc, user) => {
            const plan = user.subscription.plan;
            let fee = 0;
            if (plan === 'Monthly') fee = 2499;
            if (plan === 'Annually') fee = 2008; // ₹24,099 / 12 ~ 2008 monthly MRR contribution
            return acc + fee;
        }, 0);

        // 3. Distributions
        // Role Distribution
        const roleDist = await User.aggregate([
            { $group: { _id: "$role", value: { $sum: 1 } } }
        ]);
        const roleDistribution = roleDist.map(r => ({
            name: r._id.charAt(0).toUpperCase() + r._id.slice(1),
            value: r.value
        }));

        // Plan Distribution
        const planDist = await User.aggregate([
            { $match: { role: 'admin' } },
            { $group: { _id: "$subscription.plan", value: { $sum: 1 } } }
        ]);
        const planDistribution = planDist.map(p => ({
            name: p._id || 'None',
            value: p.value
        }));

        // City Distribution
        const cityDist = await User.aggregate([
            { $match: { role: 'admin' } },
            { $group: { _id: "$city", value: { $sum: 1 } } },
            { $sort: { value: -1 } },
            { $limit: 5 }
        ]);
        const cityDistribution = cityDist.map(c => ({ name: c._id || 'Unknown', value: c.value }));

        // 4. Growth & Revenue Trends
        const { startDate, endDate } = req.query;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Growth (New Users)
        const userGrowth = await User.aggregate([
            { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }
        ]);

        // Revenue Trend (Real Payments)
        const paymentTrend = await User.aggregate([
            { $unwind: "$payments" },
            { $match: { "payments.status": "Completed" } },
            { $group: { _id: { $month: "$payments.date" }, total: { $sum: "$payments.amount" } } }
        ]);

        let combinedTrend = Array(12).fill(0).map((_, i) => ({
            name: months[i],
            revenue: 0,
            users: 0
        }));

        userGrowth.forEach(g => { if (g._id >= 1 && g._id <= 12) combinedTrend[g._id - 1].users = g.count; });
        paymentTrend.forEach(p => { if (p._id >= 1 && p._id <= 12) combinedTrend[p._id - 1].revenue = p.total; });

        // 5. Recent Activity
        const recentRestaurants = await User.find({ role: 'admin' })
            .select('name restaurantName email subscription createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            totalUsers,
            totalRestaurants: totalAdmins,
            totalCustomers,
            activeRestaurants,
            pendingApprovals,
            platformTotalRevenue,
            estimatedMRR,
            roleDistribution,
            planDistribution,
            cityDistribution,
            trendData: combinedTrend,
            recentRestaurants
        });

    } catch (error) {
        console.error("Super Admin Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAdminStats, getSuperAdminStats };
