import { prisma } from '../../../config/database.js'

export const getDashboard = async (req, res) => {
    const brandId = req.session?.brandId
    if (!brandId) return res.redirect('/login')

    const today = new Date()

    const [
        totalCustomers,
        activeSubscriptions,
        totalOrders,
        todayOrders,
        activeCustomers,
        inactiveCustomers,
        pendingVerification,
        totalFoodItems,
        activeFoodItems,
    ] = await Promise.all([
        prisma.customer.count({ where: { brandId } }),
        prisma.customerSubscription.count({
            where: { brandId, status: 'ACTIVE' },
        }),
        prisma.order.count({
            where: { subscription: { brandId } },
        }),
        prisma.order.count({
            where: {
                subscription: { brandId },
                orderDate: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                    lte: new Date(today.setHours(23, 59, 59, 999)),
                },
            },
        }),
        prisma.customer.count({
            where: {
                brandId,
                status: 'ACTIVE',
                subscriptions: { some: { status: 'ACTIVE' } },
            },
        }),
        prisma.customer.count({ where: { brandId, status: 'INACTIVE' } }),
        prisma.customer.count({ where: { brandId, isVerified: false } }),
        prisma.foodItem.count({ where: { category: { brandId } } }),
        prisma.foodItem.count({
            where: { category: { brandId }, isActive: true },
        }),
    ])

    // Recent Orders
    const recentOrders = await prisma.order.findMany({
        where: { subscription: { brandId } },
        include: {
            customer: { select: { name: true, mobile: true } },
            category: { select: { name: true } },
            plan: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    })

    const stats = {
        totalCustomers,
        activeSubscriptions,
        totalOrders,
        todayOrders,
        activeCustomers,
        inactiveCustomers,
        pendingVerification,
        totalFoodItems,
        activeFoodItems,
    }

    res.render('admin/dashboard/admin', {
        title: 'Dashboard',
        stats,
        recentOrders,
        totalUnits: totalCustomers,
    })
}
