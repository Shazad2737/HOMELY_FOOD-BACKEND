import { prisma } from '../../../config/database.js'

export const deliveryMarkingPage = async (req, res) => {
    res.render('admin/delivery/mark')
}

export const deliveryJson = async (req, res) => {
    try {
        const {
            draw,
            start = 0,
            length = 100,
            startDate,
            endDate,
            mealTypeId,
            status,
        } = req.query

        const searchValue = req.query['search[value]'] || ''
        const orderColumnIndex = req.query['order[0][column]']
        const orderDirection = req.query['order[0][dir]'] || 'asc'

        const skip = parseInt(start)
        const take = parseInt(length)

        // Build where clause
        const where = {}

        // Search filter
        if (searchValue) {
            where.OR = [
                {
                    order: {
                        orderNumber: {
                            contains: searchValue,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    order: {
                        customer: {
                            name: {
                                contains: searchValue,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    order: {
                        customer: {
                            mobile: {
                                contains: searchValue,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    order: {
                        customer: {
                            customerCode: {
                                contains: searchValue,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ]
        }

        // Filter by order date range
        if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            where.order = {
                orderDate: {
                    gte: start,
                    lte: end,
                },
                status: 'CONFIRMED', // Only show confirmed orders
                customer: {
                    brandId: req.session.brandId, // Filter by brand
                },
            }
        } else if (startDate) {
            // If only startDate provided
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            where.order = {
                orderDate: {
                    gte: start,
                },
                status: 'CONFIRMED',
                customer: {
                    brandId: req.session.brandId,
                },
            }
        } else if (endDate) {
            // If only endDate provided
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            where.order = {
                orderDate: {
                    lte: end,
                },
                status: 'CONFIRMED',
                customer: {
                    brandId: req.session.brandId,
                },
            }
        } else {
            // Default to today if no date provided
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const endOfDay = new Date()
            endOfDay.setHours(23, 59, 59, 999)

            where.order = {
                orderDate: {
                    gte: today,
                    lte: endOfDay,
                },
                status: 'CONFIRMED',
                customer: {
                    brandId: req.session.brandId,
                },
            }
        }

        // Filter by meal type
        if (mealTypeId) {
            where.mealTypeId = mealTypeId
        }

        // Filter by delivery status
        if (status === 'DELIVERED') {
            where.deliveredDate = { not: null }
        } else if (status === 'PENDING') {
            where.deliveredDate = null
        }

        // Get total count
        const recordsTotal = await prisma.orderItem.count({
            where: {
                order: {
                    status: 'CONFIRMED',
                    customer: {
                        brandId: req.session.brandId,
                    },
                },
            },
        })

        // Get filtered count
        const recordsFiltered = await prisma.orderItem.count({ where })

        // Build orderBy based on column index
        let orderBy = []

        // Column mapping: 0=checkbox, 1=orderNumber, 2=customer, 3=mealType, 4=foodItem, 5=location, 6=status, 7=action
        if (orderColumnIndex) {
            switch (orderColumnIndex) {
                case '1': // Order Number
                    orderBy.push({ order: { orderNumber: orderDirection } })
                    break
                case '2': // Customer Name
                    orderBy.push({
                        order: { customer: { name: orderDirection } },
                    })
                    break
                case '3': // Meal Type
                    orderBy.push({ mealType: { name: orderDirection } })
                    break
                case '4': // Food Item
                    orderBy.push({ foodItem: { name: orderDirection } })
                    break
                case '5': // Delivery Location
                    orderBy.push({ deliveryLocation: { type: orderDirection } })
                    break
                case '6': // Status (deliveredDate)
                    orderBy.push({ deliveredDate: orderDirection })
                    break
                default:
                    orderBy.push({ order: { orderNumber: 'asc' } })
            }
        } else {
            // Default sorting
            orderBy = [
                { mealType: { name: 'asc' } },
                { order: { orderNumber: 'asc' } },
            ]
        }

        // Get order items with all necessary relations
        const orderItems = await prisma.orderItem.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                order: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                mobile: true,
                            },
                        },
                    },
                },
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
                    },
                },
                deliveryLocation: {
                    include: {
                        area: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        res.json({
            draw: parseInt(draw),
            recordsTotal,
            recordsFiltered,
            data: orderItems,
        })
    } catch (error) {
        console.error('Error fetching delivery items:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery items',
            error: error.message,
        })
    }
}

export const markAsDelivered = async (req, res) => {
    const { itemIds } = req.body
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide valid item IDs',
        })
    }

    const deliveredDate = new Date()

    // Update order items
    const result = await prisma.orderItem.updateMany({
        where: {
            id: { in: itemIds },
            deliveredDate: null,
            order: {
                status: 'CONFIRMED',
                customer: {
                    brandId: req.session.brandId,
                },
            },
        },
        data: {
            deliveredDate,
        },
    })

    // Get affected orders with customer info
    const orderItems = await prisma.orderItem.findMany({
        where: { id: { in: itemIds } },
        select: {
            orderId: true,
            order: {
                select: {
                    customerId: true,
                    orderNumber: true,
                },
            },
        },
        distinct: ['orderId'],
    })

    // Track which customers need notifications
    // const customersToNotify = new Set()

    for (const item of orderItems) {
        const allItemsDelivered = await prisma.orderItem.findMany({
            where: {
                orderId: item.orderId,
                deliveredDate: null,
            },
        })

        // If all items are delivered, update order status and send notification
        if (allItemsDelivered.length === 0) {
            await prisma.order.update({
                where: { id: item.orderId },
                data: { status: 'DELIVERED' },
            })

            // Create notification for customer
            await prisma.notification.create({
                data: {
                    brandId: req.session.brandId,
                    customerId: item.order.customerId,
                    type: 'DELIVERY',
                    priority: 'NORMAL',
                    caption: 'Order Delivered',
                    description: `Your order #${item.order.orderNumber} has been successfully delivered!`,
                    sentAt: new Date(),
                },
            })

            // customersToNotify.add(item.order.customerId)
        }
    }

    res.json({
        success: true,
        message: `${result.count} item(s) marked as delivered`,
        count: result.count,
        // notificationsSent: customersToNotify.size,
    })
}

export const getMealTypes = async (req, res) => {
    const mealTypes = await prisma.mealType.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            type: true,
        },
        orderBy: {
            sortOrder: 'asc',
        },
    })

    res.json({
        success: true,
        mealTypes,
    })
}
