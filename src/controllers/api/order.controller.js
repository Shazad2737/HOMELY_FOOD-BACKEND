import { prisma } from '../../../config/database.js'
import {
    checkDuplicateOrder,
    generateOrderNumber,
    getAvailableFoodItems,
    validateOrderDate,
    validateOrderItemsAvailability,
    validateOrderItemsExistence,
} from '../../../helpers/order.helper.js'
import { OrderDaysResponseResource } from '../../resources/order-days.resource.js'
import { getHolidaysFromCache } from '../../utils/cache.js'
import { CustomError } from '../../utils/customError.js'
import {
    addDays,
    formatDateOnly,
    getDayOfWeek,
    getHourInTimezone,
} from '../../utils/dateHelper.js'
import { logger } from '../../utils/logger.js'
import { apiResponse } from '../../utils/responseHandler.js'

export const getAvailableOrderDays = async (req, res) => {
    const customerId = req.user.id
    const timezone = req.country.timezone
    const search = req.query.search?.trim() || null

    // === Fetch Customer and Subscription ===
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
            locations: {
                where: { isDeleted: false },
            },
            subscriptions: {
                where: { status: 'ACTIVE' },
                include: {
                    plan: {
                        select: {
                            id: true,
                            type: true,
                            category: { select: { name: true } },
                        },
                    },
                    subscriptionMealTypes: {
                        include: { mealType: true },
                    },
                },
            },
        },
    })

    if (!customer) throw new CustomError(404, 'Customer not found')
    if (customer.locations.length === 0)
        throw new CustomError(400, 'No delivery location found')

    const customerAreaIds = customer.locations
        .map((loc) => loc.areaId)
        .filter(Boolean)

    let activeSubscription = customer.subscriptions[0]
    if (!activeSubscription)
        throw new CustomError(400, 'No active subscription found')

    const { advanceOrderCutoffHour, minAdvanceOrderDays, maxAdvanceOrderDays } =
        req.brandSettings

    const today = new Date()
    const currentHour = getHourInTimezone(today, timezone)

    let startDayOffset = minAdvanceOrderDays
    if (currentHour >= advanceOrderCutoffHour) {
        startDayOffset = minAdvanceOrderDays + 1
    }

    // Calculate date boundaries considering both advance order rules AND subscription period
    const advanceStartDate = addDays(today, startDayOffset, timezone)
    const advanceEndDate = addDays(today, maxAdvanceOrderDays, timezone)

    // Normalize subscription dates for comparison
    const subStartDate = new Date(
        formatDateOnly(activeSubscription.startDate, timezone)
    )
    const subEndDate = new Date(
        formatDateOnly(activeSubscription.endDate, timezone)
    )

    // Actual start date is the later of: advance start date OR subscription start date
    const actualStartDate =
        advanceStartDate > subStartDate ? advanceStartDate : subStartDate

    // Actual end date is the earlier of: advance end date OR subscription end date
    const actualEndDate =
        advanceEndDate < subEndDate ? advanceEndDate : subEndDate

    logger.info('Date range calculation', {
        customerId,
        timezone,
        advanceStartDate: formatDateOnly(advanceStartDate, timezone),
        advanceEndDate: formatDateOnly(advanceEndDate, timezone),
        subStartDate: formatDateOnly(subStartDate, timezone),
        subEndDate: formatDateOnly(subEndDate, timezone),
        actualStartDate: formatDateOnly(actualStartDate, timezone),
        actualEndDate: formatDateOnly(actualEndDate, timezone),
    })

    // Check if there's any valid date range
    if (actualStartDate > actualEndDate) {
        throw new CustomError(
            400,
            'No available dates within both advance order window and subscription period'
        )
    }

    // Normalize dates to start of day for database query to match orders stored at midnight
    const queryStartDate = new Date(formatDateOnly(actualStartDate, timezone))
    const queryEndDate = new Date(formatDateOnly(actualEndDate, timezone))
    queryEndDate.setHours(23, 59, 59, 999) // End of day to include all orders on that date

    // === Fetch existing orders within the actual date range ===
    const existingOrders = await prisma.order.findMany({
        where: {
            customerId,
            status: { not: 'CANCELLED' },
            orderDate: {
                gte: queryStartDate,
                lte: queryEndDate,
            },
        },
        select: {
            orderDate: true,
            orderNumber: true,
            status: true,
        },
    })

    // Create a map of already ordered dates for quick lookup
    const orderedDatesMap = new Map()
    existingOrders.forEach((order) => {
        const dateKey = formatDateOnly(order.orderDate, timezone)
        orderedDatesMap.set(dateKey, {
            orderNumber: order.orderNumber,
            status: order.status,
        })
    })

    // === Fetch holidays and all relevant food items ===
    const [holidays, allFoodItems] = await Promise.all([
        getHolidaysFromCache(customer.brandId),
        prisma.foodItem.findMany({
            where: {
                isActive: true,
                mealTypeId: {
                    in: activeSubscription.subscriptionMealTypes.map(
                        (smt) => smt.mealTypeId
                    ),
                },
                mealType: {
                    isActive: true,
                },
                planAvailability: {
                    some: { planId: activeSubscription.planId },
                },
                locations: {
                    some: {
                        areaId: { in: customerAreaIds },
                    },
                },
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        {
                            description: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        { code: { contains: search, mode: 'insensitive' } },
                        { cuisine: { contains: search, mode: 'insensitive' } },
                        { style: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            },
            include: {
                mealType: true,
                availableDays: { select: { dayOfWeek: true } },
                deliverWith: true,
                locations: true,
            },
            orderBy: { name: 'asc' },
        }),
    ])

    // === Preprocess holidays for quick lookup ===
    const holidayMap = {
        SPECIFIC_DATE: new Map(),
        RECURRING_WEEKLY: new Map(),
    }
    holidays.forEach((h) => {
        if (h.type === 'SPECIFIC_DATE') {
            const key = formatDateOnly(h.date, timezone)
            holidayMap.SPECIFIC_DATE.set(key, h.name)
        } else if (h.type === 'RECURRING_WEEKLY') {
            holidayMap.RECURRING_WEEKLY.set(h.dayOfWeek, h.name)
        }
    })

    // === Group food items by available days ===
    const foodByDay = {}
    for (const item of allFoodItems) {
        for (const d of item.availableDays) {
            if (!foodByDay[d.dayOfWeek]) foodByDay[d.dayOfWeek] = []
            foodByDay[d.dayOfWeek].push(item)
        }
    }

    // Calculate how many days to iterate (from actualStartDate to actualEndDate)
    // Normalize both dates to start of day to ensure accurate day count
    const normalizedStartDate = new Date(
        formatDateOnly(actualStartDate, timezone)
    )
    const normalizedEndDate = new Date(formatDateOnly(actualEndDate, timezone))

    const daysToGenerate =
        Math.floor(
            (normalizedEndDate.getTime() - normalizedStartDate.getTime()) /
                (1000 * 60 * 60 * 24)
        ) + 1

    logger.info('Days generation calculation', {
        customerId,
        timezone,
        normalizedStartDate: formatDateOnly(normalizedStartDate, timezone),
        normalizedEndDate: formatDateOnly(normalizedEndDate, timezone),
        daysToGenerate,
    })

    // === Generate available days ===
    const availableDays = []

    // Loop through only the valid date range
    for (let i = 0; i < daysToGenerate; i++) {
        const orderDate = addDays(normalizedStartDate, i, timezone)
        const dayOfWeek = getDayOfWeek(orderDate, timezone)
        const dateString = formatDateOnly(orderDate, timezone)

        logger.info(`Processing day ${i + 1}/${daysToGenerate}`, {
            customerId,
            iteration: i,
            dateString,
            dayOfWeek,
        })

        // Double check: skip if date is outside subscription period (compare as date strings)
        const subStartDateStr = formatDateOnly(subStartDate, timezone)
        const subEndDateStr = formatDateOnly(subEndDate, timezone)

        if (dateString < subStartDateStr || dateString > subEndDateStr) {
            logger.info('Date skipped - outside subscription period', {
                customerId,
                dateString,
                subStartDateStr,
                subEndDateStr,
            })
            continue
        }

        // Check if this date already has an order
        const existingOrder = orderedDatesMap.get(dateString)
        const alreadyOrdered = !!existingOrder

        const holidayName =
            holidayMap.SPECIFIC_DATE.get(dateString) ||
            holidayMap.RECURRING_WEEKLY.get(dayOfWeek) ||
            null

        const isHoliday = !!holidayName
        const foodItems = foodByDay[dayOfWeek] || []

        // Day is available only if: not holiday AND not already ordered
        const isAvailable = !isHoliday && !alreadyOrdered

        // Group by meal type
        const grouped = { breakfast: [], lunch: [], dinner: [] }

        // Only populate food items if day is actually available
        if (isAvailable) {
            for (const item of foodItems) {
                const matchedCustomerLocations = customer.locations.filter(
                    (loc) =>
                        item.locations.some(
                            (floc) => floc.areaId === loc.areaId
                        )
                )

                const info = {
                    id: item.id,
                    name: item.name,
                    code: item.code,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    cuisine: item.cuisine,
                    style: item.style,
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    mealTypeId: item.mealType.id,
                    deliveryMode: item.deliveryMode,
                    deliverWith: item.deliverWith?.type,
                    deliveryTime: {
                        start: item.mealType.startTime,
                        end: item.mealType.endTime,
                    },
                    availableDays: item.availableDays,
                    availableLocations: matchedCustomerLocations.map((loc) => ({
                        id: loc.id,
                        name: loc.name,
                        areaId: loc.areaId,
                        areaName: loc.area?.name,
                        locationId: loc.locationId,
                        type: loc.type,
                        isDefault: loc.isDefault,
                    })),
                }

                switch (item.mealType.type) {
                    case 'BREAKFAST':
                        grouped.breakfast.push(info)
                        break
                    case 'LUNCH':
                        grouped.lunch.push(info)
                        break
                    case 'DINNER':
                        grouped.dinner.push(info)
                        break
                }
            }
        }

        availableDays.push({
            date: dateString,
            dayOfWeek,
            isAvailable,
            isHoliday,
            holidayName,
            alreadyOrdered,
            existingOrderNumber: existingOrder?.orderNumber || null,
            existingOrderStatus: existingOrder?.status || null,
            foodItems: grouped,
            availableMealTypes: {
                breakfast: grouped.breakfast.length > 0,
                lunch: grouped.lunch.length > 0,
                dinner: grouped.dinner.length > 0,
            },
        })

        logger.info('Day added to availableDays', {
            customerId,
            dateString,
            isAvailable,
            isHoliday,
            alreadyOrdered,
            foodItemsCount: foodItems.length,
        })
    }

    logger.info('Available days generation completed', {
        customerId,
        totalDaysGenerated: availableDays.length,
        firstDate: availableDays[0]?.date,
        lastDate: availableDays[availableDays.length - 1]?.date,
    })

    if (availableDays.length === 0) {
        throw new CustomError(400, 'No available days for ordering')
    }

    // === Response ===
    activeSubscription.startDate = formatDateOnly(
        activeSubscription.startDate,
        timezone
    )

    activeSubscription.endDate = formatDateOnly(
        activeSubscription.endDate,
        timezone
    )

    const orderingRules = {
        minAdvanceOrderDays,
        maxAdvanceOrderDays,
        advanceOrderCutoffHour,
        currentHour: currentHour,
        canOrderToday: currentHour < advanceOrderCutoffHour,
    }

    const response = new OrderDaysResponseResource({
        customer,
        orderingRules,
        subscription: activeSubscription,
        availableDays,
    }).exec()

    return apiResponse.success(
        res,
        'Available order days fetched successfully',
        response,
        200
    )
}

export const createOrder = async (req, res) => {
    const orderData = req.body
    const timezone = req.country.timezone
    const customerId = req.user.id

    // === Verify customer exists and get active subscription ===
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
            subscriptions: {
                where: { status: 'ACTIVE' },
                include: {
                    plan: {
                        select: {
                            id: true,
                            type: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                    subscriptionMealTypes: {
                        include: { mealType: true },
                    },
                },
            },
        },
    })

    if (!customer) throw new CustomError(404, 'Customer not found')

    const subscription = customer.subscriptions[0]
    if (!subscription) {
        throw new CustomError(400, 'No active subscription found')
    }

    const orderDate = new Date(orderData.orderDate)

    // === Check if order date is valid ===
    const dateValidation = validateOrderDate(
        orderDate,
        subscription,
        timezone,
        req.brandSettings
    )
    if (!dateValidation.valid) {
        throw new CustomError(400, dateValidation.message)
    }

    // === Check for duplicate order on same date ===
    const existingOrder = await checkDuplicateOrder(
        customerId,
        orderDate,
        timezone
    )
    if (existingOrder) {
        throw new CustomError(
            400,
            `An order has already been placed for ${formatDateOnly(
                orderDate,
                timezone
            )}. Order Number: ${existingOrder.orderNumber}.`
        )
    }

    // === Validate basic existence of items ===
    const existenceValidation = await validateOrderItemsExistence(
        orderData.orderItems,
        req.user.id
    )
    if (!existenceValidation.valid) {
        throw new CustomError(400, existenceValidation.message)
    }

    // === Check food availability for the date (holidays, plan, category) ===
    const { isHoliday, holidayName, availableFoodItems } =
        await getAvailableFoodItems(
            subscription,
            orderDate,
            timezone,
            customer.brandId
        )

    if (isHoliday) {
        throw new CustomError(
            400,
            `Cannot place order for ${formatDateOnly(
                orderDate,
                timezone
            )}. Holiday: ${holidayName}`
        )
    }

    if (availableFoodItems.length === 0) {
        throw new CustomError(
            400,
            'No food items available for the selected date'
        )
    }

    // === Validate order items against available food ===
    const availabilityValidation = validateOrderItemsAvailability(
        orderData.orderItems,
        availableFoodItems
    )

    if (!availabilityValidation.valid) {
        throw new CustomError(400, availabilityValidation.message)
    }

    // === Generate unique order number ===
    const orderNumber = await generateOrderNumber()

    // === Create order with items in a transaction ===
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                orderNumber,
                orderDate,
                status: 'CONFIRMED',
                notes: orderData.notes,
                customer: {
                    connect: { id: customerId },
                },
                subscription: {
                    connect: { id: subscription.id },
                },
                category: {
                    connect: { id: subscription.categoryId },
                },
                plan: {
                    connect: { id: subscription.planId },
                },
                orderItems: {
                    create: orderData.orderItems.map((item) => ({
                        notes: item.notes,
                        foodItem: {
                            connect: { id: item.foodItemId },
                        },
                        mealType: {
                            connect: { id: item.mealTypeId },
                        },
                        deliveryLocation: {
                            connect: { id: item.deliveryLocationId },
                        },
                    })),
                },
            },
            include: {
                orderItems: {
                    include: {
                        foodItem: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                        mealType: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        })

        return newOrder
    })

    // === Format response ===
    const formattedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        orderDate: formatDateOnly(order.orderDate, timezone),
        status: order.status,
        notes: order.notes,
        orderItems: order.orderItems.map((item) => ({
            id: item.id,
            foodItem: item.foodItem,
            mealType: item.mealType,
            notes: item.notes,
        })),
    }

    return apiResponse.success(
        res,
        'Order placed successfully',
        formattedOrder,
        201
    )
}

export const getOrders = async (req, res) => {
    const customerId = req.user.id
    const { type = 'ongoing', page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // === Determine order filter ===
    let statusFilter
    if (type === 'ongoing') {
        statusFilter = { in: ['CONFIRMED'] }
    } else {
        statusFilter = { in: ['DELIVERED', 'CANCELLED'] }
    }

    // === Fetch paginated orders ===
    const orders = await prisma.order.findMany({
        where: {
            customerId,
            status: statusFilter,
        },
        include: {
            orderItems: {
                include: {
                    mealType: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            startTime: true,
                            endTime: true,
                        },
                    },
                    foodItem: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            description: true,
                            imageUrl: true,
                            cuisine: true,
                            style: true,
                        },
                    },
                    deliveryLocation: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            },
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take,
    })

    // === Group orders by orderDate (day) ===
    const groupedOrders = orders.reduce((acc, order) => {
        const dateKey = formatDateOnly(order.orderDate)
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push({
            id: order.id,
            orderNumber: order.orderNumber,
            orderDate: formatDateOnly(order.orderDate),
            status: order.status,
            notes: order.notes,
            orderItems: order.orderItems.map((item) => ({
                id: item.id,
                foodItem: item.foodItem,
                mealType: item.mealType,
                deliveryLocation: item.deliveryLocation,
                notes: item.notes,
            })),
        })
        return acc
    }, {})

    // === Convert grouped object to array ===
    const groupedArray = Object.entries(groupedOrders).map(([date, items]) => ({
        date,
        orders: items,
    }))

    // === Count total records for pagination ===
    const total = await prisma.order.count({
        where: {
            customerId,
            status: statusFilter,
        },
    })

    // === Response ===
    return apiResponse.success(res, 'Orders fetched', {
        data: groupedArray,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    })
}
