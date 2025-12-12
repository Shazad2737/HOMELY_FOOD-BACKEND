import { formatInTimeZone } from 'date-fns-tz'

import { prisma } from '../../../config/database.js'
import { Enums } from '../../utils/prismaEnums.js'
import { envConfig } from '../../../config/env.js'

export const listSubscriptions = async (req, res) => {
    return res.render('admin/subscription/list', {
        statusOptions: Object.values(Enums.SubscriptionStatus),
    })
}

export const getsJson = async (req, res) => {
    const { start = 0, length = 50, order, columns } = req.query
    const { customerId, status } = req.query
    const brandId = req.session.brandId

    const searchValue = req.query['search[value]'] || ''

    const skip = parseInt(start)
    const take = parseInt(length)

    // Build where clause
    const where = { brandId }

    if (customerId) where.customerId = customerId
    if (status) where.status = status

    if (searchValue) {
        where.OR = [
            {
                customer: {
                    name: { contains: searchValue, mode: 'insensitive' },
                },
            },
            {
                customer: {
                    mobile: { contains: searchValue, mode: 'insensitive' },
                },
            },
            {
                customer: {
                    customerCode: { contains: searchValue, mode: 'insensitive' },
                },
            },
        ]
    }

    // Build order by
    let orderBy = { createdAt: 'desc' }
    if (order && order.length > 0) {
        const orderColumn = columns[order[0].column]?.data
        const orderDir = order[0].dir
        if (orderColumn) {
            if (orderColumn === 'customer.name') {
                orderBy = { customer: { name: orderDir } }
            } else if (
                ['startDate', 'endDate', 'status', 'createdAt'].includes(
                    orderColumn
                )
            ) {
                orderBy = { [orderColumn]: orderDir }
            }
        }
    }

    const [subscriptions, totalRecords] = await Promise.all([
        prisma.customerSubscription.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile: true,
                    },
                },
                subscriptionMealTypes: {
                    select: {
                        mealType: true,
                    },
                },
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        }),
        prisma.customerSubscription.count({ where }),
    ])

    const timeZone =
        req.session?.country?.timezone || envConfig.general.DEFAULT_TIMEZONE

    const formattedSubscriptions = subscriptions.map((sub) => ({
        ...sub,
        startDate: formatInTimeZone(sub.startDate, timeZone, 'yyyy-MM-dd'),
        endDate: formatInTimeZone(sub.endDate, timeZone, 'yyyy-MM-dd'),
    }))

    return res.json({
        draw: parseInt(req.query.draw) || 1,
        recordsTotal: totalRecords,
        recordsFiltered: totalRecords,
        data: formattedSubscriptions,
    })
}

export const renderSubscriptionForm = async (req, res) => {
    const brandId = req.session.brandId
    const { id } = req.params

    const mealTypes = await prisma.mealType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
    })

    const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, type: true },
    })

    const categories = await prisma.category.findMany({
        where: { brandId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
    })

    let subscription = null
    if (id) {
        subscription = await prisma.customerSubscription.findFirst({
            where: { id, brandId },
            include: {
                customer: true,
                plan: true,
                category: true,
                subscriptionMealTypes: { include: { mealType: true } },
            },
        })

        if (!subscription) {
            return res.status(404)
        }
    }

    return res.render('admin/subscription/form', {
        title: id ? 'Edit Subscription' : 'Add Subscription',
        subscription,
        mealTypes,
        plans,
        categories,
        statusOptions: Object.values(Enums.SubscriptionStatus),
    })
}

export const saveSubscription = async (req, res) => {
    const {
        id,
        customerId,
        startDate,
        endDate,
        status,
        mealTypes,
        notes,
        planId,
        categoryId,
    } = req.body

    const brandId = req.session.brandId
    const createdBy = req.session.authAdmin?.id

    const customer = await prisma.customer.findFirst({
        where: { id: customerId, brandId },
    })
    if (!customer) {
        return res
            .status(406)
            .json({ success: false, error: 'Customer not found' })
    }

    const parsedStart = new Date(startDate)
    const parsedEnd = new Date(endDate)
    if (isNaN(parsedStart) || isNaN(parsedEnd)) {
        return res.status(406).json({ success: false, error: 'Invalid dates' })
    }

    // Check for overlapping active subscriptions
    const requestedStatus = status || 'ACTIVE'

    if (requestedStatus === 'ACTIVE') {
        const overlappingSubscriptions =
            await prisma.customerSubscription.findMany({
                where: {
                    customerId,
                    brandId,
                    status: 'ACTIVE',
                    id: id ? { not: id } : undefined,
                    OR: [
                        // New subscription starts during an existing subscription
                        {
                            AND: [
                                { startDate: { lte: parsedStart } },
                                { endDate: { gte: parsedStart } },
                            ],
                        },
                        // New subscription ends during an existing subscription
                        {
                            AND: [
                                { startDate: { lte: parsedEnd } },
                                { endDate: { gte: parsedEnd } },
                            ],
                        },
                        // New subscription completely encompasses an existing subscription
                        {
                            AND: [
                                { startDate: { gte: parsedStart } },
                                { endDate: { lte: parsedEnd } },
                            ],
                        },
                    ],
                },
            })

        if (overlappingSubscriptions.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Another active subscription already exists for this period',
            })
        }
    }

    const subscription = await prisma.$transaction(async (tx) => {
        if (id) {
            const existing = await tx.customerSubscription.findFirst({
                where: { id, brandId },
            })
            if (!existing) return null

            await tx.subscriptionMealType.deleteMany({
                where: { subscriptionId: id },
            })

            const updated = await tx.customerSubscription.update({
                where: { id },
                data: {
                    customer: { connect: { id: customerId } },
                    plan: planId
                        ? { connect: { id: planId } }
                        : { disconnect: true },
                    category: categoryId
                        ? { connect: { id: categoryId } }
                        : { disconnect: true },
                    startDate: parsedStart,
                    endDate: parsedEnd,
                    status: requestedStatus,
                    notes: notes || null,
                    updatedAt: new Date(),
                },
                include: {
                    customer: true,
                    plan: true,
                    category: true,
                    subscriptionMealTypes: { include: { mealType: true } },
                },
            })

            if (Array.isArray(mealTypes) && mealTypes.length > 0) {
                await tx.subscriptionMealType.createMany({
                    data: mealTypes.map((mealTypeId) => ({
                        subscriptionId: id,
                        mealTypeId,
                    })),
                })
            }

            return updated
        }

        // --- Create new subscription ---
        // Check if this is the only subscription for the customer
        const existingSubscriptionsCount = await tx.customerSubscription.count({
            where: { customerId, brandId },
        })

        // Force ACTIVE status if this is the first subscription
        const finalStatus =
            existingSubscriptionsCount === 0 ? 'ACTIVE' : requestedStatus

        const newSubscription = await tx.customerSubscription.create({
            data: {
                customer: { connect: { id: customerId } },
                brand: { connect: { id: brandId } },
                plan: planId ? { connect: { id: planId } } : undefined,
                category: categoryId
                    ? { connect: { id: categoryId } }
                    : undefined,
                startDate: parsedStart,
                endDate: parsedEnd,
                status: finalStatus,
                createdBy,
                notes: notes || null,
            },
        })

        if (Array.isArray(mealTypes) && mealTypes.length > 0) {
            await tx.subscriptionMealType.createMany({
                data: mealTypes.map((mealTypeId) => ({
                    subscriptionId: newSubscription.id,
                    mealTypeId,
                })),
            })
        }

        return tx.customerSubscription.findUnique({
            where: { id: newSubscription.id },
            include: {
                customer: true,
                plan: true,
                category: true,
                subscriptionMealTypes: { include: { mealType: true } },
            },
        })
    })

    if (!subscription) {
        return res.status(406).json({ success: false, error: 'Not acceptable' })
    }

    return res.json({
        success: true,
        message: id
            ? 'Subscription updated successfully'
            : 'Subscription created successfully',
        data: subscription,
    })
}

export const cancelSubscription = async (req, res) => {
    const { id } = req.params
    const brandId = req.session.brandId

    if (!id) {
        return res.status(400).json({
            success: false,
            error: 'Subscription ID is required',
        })
    }

    const result = await prisma.$transaction(async (tx) => {
        // Find the subscription
        const subscription = await tx.customerSubscription.findFirst({
            where: { id, brandId },
            include: {
                orders: {
                    where: {
                        status: { not: 'CANCELLED' },
                    },
                },
            },
        })

        if (!subscription) {
            return {
                success: false,
                error: 'Subscription not found',
                status: 404,
            }
        }

        if (subscription.status === 'CANCELLED') {
            return {
                success: false,
                error: 'Subscription is already cancelled',
                status: 400,
            }
        }

        // Cancel all non-cancelled orders associated with this subscription
        const ordersToCancel = subscription.orders.filter(
            (order) => order.status !== 'CANCELLED'
        )

        if (ordersToCancel.length > 0) {
            await tx.order.updateMany({
                where: {
                    subscriptionId: id,
                    status: { not: 'CANCELLED' },
                },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date(),
                },
            })
        }

        // Update subscription status to CANCELLED
        const updatedSubscription = await tx.customerSubscription.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date(),
            },
            include: {
                customer: true,
                plan: true,
                category: true,
                subscriptionMealTypes: { include: { mealType: true } },
                orders: true,
            },
        })

        return {
            success: true,
            data: updatedSubscription,
            cancelledOrdersCount: ordersToCancel.length,
        }
    })

    if (!result.success) {
        return res.status(result.status).json({
            success: false,
            error: result.error,
        })
    }

    return res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        cancelledOrdersCount: result.cancelledOrdersCount,
    })
}

export const getCustomers = async (req, res) => {
    const brandId = req.session.brandId

    const customers = await prisma.customer.findMany({
        where: { brandId, status: 'ACTIVE' },
        select: {
            id: true,
            name: true,
            customerCode: true,
            mobile: true,
        },
        orderBy: { name: 'asc' },
    })

    return res.json({
        success: true,
        customers,
    })
}

export const getPlansByCategory = async (req, res) => {
    const { categoryId } = req.query

    const plans = await prisma.plan.findMany({
        where: { categoryId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
    })

    return res.json({
        success: true,
        plans,
    })
}
