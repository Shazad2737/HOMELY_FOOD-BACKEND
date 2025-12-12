import { prisma } from '../../../config/database.js'
import { envConfig } from '../../../config/env.js'
import { removeCache } from '../../../config/redis.js'

export const customerList = async (req, res) => {
    res.render('admin/customer/list')
}

export const customerJson = async (req, res) => {
    try {
        const { draw, start = 0, length = 50, status, isVerified } = req.query

        const skip = parseInt(start)
        const take = parseInt(length)
        const searchValue = req.query['search[value]'] || ''

        // Build where clause
        const where = {
            brandId: req.session.brandId,
        }

        // Status filter
        if (status) {
            where.status = status
        }

        // Verification filter
        if (isVerified !== undefined && isVerified !== '') {
            where.isVerified = isVerified === 'true'
        }

        // Search filter
        if (searchValue) {
            where.OR = [
                { name: { contains: searchValue, mode: 'insensitive' } },
                { email: { contains: searchValue, mode: 'insensitive' } },
                { mobile: { contains: searchValue } },
                {
                    customerCode: {
                        contains: searchValue,
                        mode: 'insensitive',
                    },
                },
            ]
        }

        // Get total count
        const recordsTotal = await prisma.customer.count({
            where: { brandId: req.session.brandId },
        })

        // Get filtered count
        const recordsFiltered = await prisma.customer.count({ where })

        // Get customers with relations
        const customers = await prisma.customer.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        orders: true,
                        subscriptions: true,
                        locations: true,
                    },
                },
            },
        })

        res.json({
            draw: parseInt(draw),
            recordsTotal,
            recordsFiltered,
            data: customers,
        })
    } catch (error) {
        console.error('Error fetching customers:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
            error: error.message,
        })
    }
}

export const customerView = async (req, res) => {
    const { id } = req.params

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            locations: {
                include: {
                    area: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { isDefault: 'desc' },
            },
            orders: {
                take: 10,
                orderBy: { orderDate: 'desc' },
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                        },
                    },
                },
            },
            subscriptions: {
                include: {
                    plan: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            _count: {
                select: {
                    orders: true,
                    subscriptions: true,
                    locations: true,
                },
            },
        },
    })

    if (!customer) {
        return res.status(404).render('admin/errors/404', {
            error: 'The requested customer could not be found',
        })
    }

    // Check if customer belongs to the same brand
    if (customer.brandId !== req.session.brandId) {
        return res.status(403).render('admin/errors/403', {
            error: 'You do not have permission to view this customer',
        })
    }

    res.render('admin/customer/view', {
        title: `Customer - ${customer.name}`,
        page: 'customer-view',
        customer,
    })
}

export const updateCustomerStatus = async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status value',
        })
    }

    const customer = await prisma.customer.findUnique({
        where: { id },
        select: { id: true, brandId: true },
    })

    if (!customer) {
        return res.status(404).json({
            success: false,
            error: 'Customer not found',
        })
    }

    if (customer.brandId !== req.session.brandId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
        })
    }

    await prisma.customer.update({
        where: { id },
        data: { status },
    })

    const sessionKey = `${envConfig.cache.KEY_PREFIX}-cus-auth-${customer.id}`
    await removeCache([sessionKey])

    return res.json({
        success: true,
        message: `Customer status updated to ${status} and cache cleared.`,
    })
}
