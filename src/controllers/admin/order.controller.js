import { prisma } from '../../../config/database.js'
import { Enums } from '../../utils/prismaEnums.js'

export const orderList = async (req, res) => {
    res.render('admin/order/list')
}

export const orderListJson = async (req, res) => {
    try {
        const { start, length, customerId, status, startDate, endDate } =
            req.query

        const searchValue = req.query['search[value]'] || ''

        const page = parseInt(start) / parseInt(length) + 1
        const limit = parseInt(length)
        const skip = parseInt(start)

        // Build where clause
        let where = {
            customer: {
                brandId: req.session.brandId,
            },
        }

        // Search filter
        if (searchValue) {
            where.OR = [
                {
                    orderNumber: {
                        contains: searchValue,
                        mode: 'insensitive',
                    },
                },
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
                        customerCode: {
                            contains: searchValue,
                            mode: 'insensitive',
                        },
                    },
                },
            ]
        }

        // Customer filter
        if (customerId) {
            where.customerId = customerId
        }

        // Status filter
        if (status) {
            where.status = status
        }

        // Order date range filter
        if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            where.orderDate = {
                gte: start,
                lte: end,
            }
        } else if (startDate) {
            // If only startDate provided
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            where.orderDate = {
                gte: start,
            }
        } else if (endDate) {
            // If only endDate provided
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            where.orderDate = {
                lte: end,
            }
        }

        // Sorting
        let orderBy = { orderCreatedDate: 'desc' }

        const orderColumnIndex = req.query['order[0][column]']
        const orderDir = req.query['order[0][dir]'] || 'asc'
        const sortField = req.query[`columns[${orderColumnIndex}][data]`]

        if (sortField && sortField !== '') {
            if (sortField.includes('.')) {
                const parts = sortField.split('.')
                orderBy = {
                    [parts[0]]: {
                        [parts[1]]: orderDir,
                    },
                }
            } else {
                orderBy = {
                    [sortField]: orderDir,
                }
            }
        }

        // Get total count (all orders for this brand)
        const totalRecords = await prisma.order.count({
            where: {
                customer: {
                    brandId: req.session.brandId,
                },
            },
        })
        const filteredRecords = await prisma.order.count({ where })

        // Get orders with relations
        const orders = await prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                    },
                },
                subscription: {
                    select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        orderItems: true,
                    },
                },
            },
        })

        res.json({
            draw: parseInt(req.query.draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: orders,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({
            error: 'Failed to fetch orders',
            message: error.message,
        })
    }
}

export const getCustomersForFilter = async (req, res) => {
    const customers = await prisma.customer.findMany({
        where: {
            status: 'ACTIVE',
        },
        select: {
            id: true,
            name: true,
            mobile: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    res.json({
        success: true,
        customers,
    })
}

export const orderView = async (req, res) => {
    const { id } = req.params

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    mobile: true,
                    email: true,
                },
            },
            subscription: {
                select: {
                    id: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                },
            },
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            plan: {
                select: {
                    id: true,
                    name: true,
                },
            },
            orderItems: {
                include: {
                    foodItem: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    mealType: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                    deliveryLocation: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            roomNumber: true,
                            buildingName: true,
                            area: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
        },
    })

    if (!order) {
        return res.status(404).render('admin/error/404', {
            title: 'Order Not Found',
            message: 'The requested order could not be found.',
        })
    }

    res.render('admin/order/view', {
        order,
    })
}

export const cancelOrder = async (req, res) => {
    const { id } = req.params

    const order = await prisma.order.findUnique({
        where: { id },
    })

    if (!order) {
        return res.json({
            success: false,
            error: 'Order not found',
        })
    }

    if (order.status === 'CANCELLED') {
        return res.json({
            success: false,
            error: 'Order is already cancelled',
        })
    }

    await prisma.order.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
        },
    })

    res.json({
        success: true,
        message: 'Order cancelled successfully',
    })
}
