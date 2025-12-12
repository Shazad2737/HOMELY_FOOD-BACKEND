import { prisma } from '../config/database.js'
import {
    addDays,
    formatDateOnly,
    getDayOfWeek,
    getHourInTimezone,
} from '../src/utils/dateHelper.js'
import { getHolidaysFromCache } from '../src/utils/cache.js'

// Get available food items for a specific date
// Checks holidays and returns available food items
export const getAvailableFoodItems = async (
    subscription,
    orderDate,
    timezone,
    brandId
) => {
    const dayOfWeek = getDayOfWeek(orderDate, timezone)

    // Get holidays from cache
    const holidays = await getHolidaysFromCache(brandId)

    // Check for holiday
    const holiday = holidays.find((h) => {
        if (h.type === 'SPECIFIC_DATE') {
            const holidayDateFormatted = formatDateOnly(h.date, timezone)
            const orderDateFormatted = formatDateOnly(orderDate, timezone)
            const matches = holidayDateFormatted === orderDateFormatted

            return matches
        }
        if (h.type === 'RECURRING_WEEKLY') {
            const matches = h.dayOfWeek === dayOfWeek
            return matches
        }
        return false
    })

    // If holiday, return early
    if (holiday) {
        return {
            isHoliday: true,
            holidayName: holiday.name,
            availableFoodItems: [],
        }
    }

    // Fetch food items
    const foodItems = await prisma.foodItem.findMany({
        where: {
            isActive: true,
            mealTypeId: {
                in: subscription.subscriptionMealTypes.map(
                    (smt) => smt.mealTypeId
                ),
            },
            mealType: { isActive: true },
            planAvailability: {
                some: { planId: subscription.planId },
            },
            categoryId: subscription.categoryId,
            availableDays: {
                some: { dayOfWeek },
            },
        },
        include: {
            mealType: true,
            availableDays: { select: { dayOfWeek: true } },
            // locations: true,
        },
    })

    return {
        isHoliday: false,
        holidayName: null,
        availableFoodItems: foodItems,
    }
}

// Validate order items against available food items
export const validateOrderItemsAvailability = (
    orderItems,
    availableFoodItems
) => {
    const availableFoodMap = new Map(availableFoodItems.map((f) => [f.id, f]))
    const availableMealTypeIds = new Set(
        availableFoodItems.map((f) => f.mealTypeId)
    )

    // Check if all food items exist and are available
    for (const item of orderItems) {
        const foodItem = availableFoodMap.get(item.foodItemId)

        if (!foodItem) {
            return {
                valid: false,
                message: `The selected food item is not available for the chosen date. Please select an alternative.`,
            }
        }

        // Verify meal type matches food item's meal type
        if (foodItem.mealTypeId !== item.mealTypeId) {
            return {
                valid: false,
                message: `The selected item ("${foodItem.name}") does not correspond to the specified meal type. Kindly review your selection.`,
            }
        }
    }

    // Check if all meal types in order match subscription meal types
    const orderMealTypeIds = new Set(orderItems.map((item) => item.mealTypeId))
    for (const mealTypeId of orderMealTypeIds) {
        if (!availableMealTypeIds.has(mealTypeId)) {
            return {
                valid: false,
                message: `One or more selected meal types are not included in your subscription. Please review the available meal types for your plan.`,
            }
        }
    }

    // Ensure no duplicate meal types in order (one item per meal type per day)
    const itemMealTypes = orderItems.map((item) => {
        const food = availableFoodMap.get(item.foodItemId)
        return food?.mealType?.type
    })

    const itemMealTypesSet = new Set(itemMealTypes)
    if (itemMealTypes.length !== itemMealTypesSet.size) {
        return {
            valid: false,
            message: `Only one food item per meal type can be selected per day. Kindly adjust your selections.`,
        }
    }

    return { valid: true }
}

// Check if order already exists for the date
export const checkDuplicateOrder = async (customerId, orderDate, timezone) => {
    const dateString = formatDateOnly(orderDate, timezone)
    const startOfDay = new Date(dateString)
    const endOfDay = new Date(startOfDay)
    endOfDay.setHours(23, 59, 59, 999)

    const existingOrder = await prisma.order.findFirst({
        where: {
            customerId,
            orderDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: {
                not: 'CANCELLED',
            },
        },
        select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            status: true,
        },
    })

    return existingOrder
}

// Validate order date
export const validateOrderDate = (
    orderDate,
    subscription,
    timezone,
    brandSettings
) => {
    const { advanceOrderCutoffHour, minAdvanceOrderDays, maxAdvanceOrderDays } =
        brandSettings

    const today = new Date()
    const currentHour = getHourInTimezone(today, timezone)

    let minDayOffset = minAdvanceOrderDays
    if (currentHour >= advanceOrderCutoffHour) {
        minDayOffset = minAdvanceOrderDays + 1
    }

    const minOrderDate = addDays(today, minDayOffset, timezone)
    const maxOrderDate = addDays(today, maxAdvanceOrderDays, timezone)

    // Normalize dates for comparison (remove time component)
    const normalizedOrderDate = new Date(formatDateOnly(orderDate, timezone))
    const normalizedMinDate = new Date(formatDateOnly(minOrderDate, timezone))
    const normalizedMaxDate = new Date(formatDateOnly(maxOrderDate, timezone))
    const normalizedSubStart = new Date(
        formatDateOnly(subscription.startDate, timezone)
    )
    const normalizedSubEnd = new Date(
        formatDateOnly(subscription.endDate, timezone)
    )

    // Check if order date is too early
    if (normalizedOrderDate < normalizedMinDate) {
        return {
            valid: false,
            message: `Orders must be placed in accordance with the advance notice period. The earliest available order date is ${formatDateOnly(
                minOrderDate,
                timezone
            )}.`,
        }
    }

    // Check if order date is too far
    if (normalizedOrderDate > normalizedMaxDate) {
        return {
            valid: false,
            message: `Orders cannot be placed beyond the advance booking window for your plan. The latest available date is ${formatDateOnly(
                maxOrderDate,
                timezone
            )}.`,
        }
    }

    if (
        normalizedOrderDate < normalizedSubStart ||
        normalizedOrderDate > normalizedSubEnd
    ) {
        return {
            valid: false,
            message: `The selected date falls outside your subscription period (${formatDateOnly(
                subscription.startDate,
                timezone
            )} to ${formatDateOnly(
                subscription.endDate,
                timezone
            )}). Kindly select a permitted date.`,
        }
    }

    return { valid: true }
}

// Validate basic order items existence
export const validateOrderItemsExistence = async (items, customerId) => {
    // Extract unique IDs to avoid checking duplicates
    const uniqueFoodItemIds = [...new Set(items.map((item) => item.foodItemId))]
    const uniqueLocationIds = [
        ...new Set(items.map((item) => item.deliveryLocationId)),
    ]

    const [foodItems, customerLocations] = await Promise.all([
        prisma.foodItem.findMany({
            where: { id: { in: uniqueFoodItemIds } },
            select: {
                id: true,
                name: true,
                isActive: true,
                locations: {
                    select: {
                        areaId: true,
                    },
                },
            },
        }),
        prisma.customerLocation.findMany({
            where: {
                id: { in: uniqueLocationIds },
                customerId: customerId,
            },
            select: {
                id: true,
                name: true,
                areaId: true,
            },
        }),
    ])

    // Check for missing food items
    const foundFoodIds = new Set(foodItems.map((f) => f.id))
    const missingFoodIds = uniqueFoodItemIds.filter(
        (id) => !foundFoodIds.has(id)
    )
    if (missingFoodIds.length > 0) {
        return {
            valid: false,
            message: `One or more selected food items are no longer available. Please refresh the menu and try again.`,
        }
    }

    // Check for inactive food items
    const inactiveFoodItems = foodItems.filter((f) => !f.isActive)
    if (inactiveFoodItems.length > 0) {
        return {
            valid: false,
            message: `The following item(s) are currently unavailable: ${inactiveFoodItems
                .map((f) => f.name)
                .join(', ')}. Kindly select an alternative.`,
        }
    }

    // Check for missing locations
    const foundLocationIds = new Set(customerLocations.map((l) => l.id))
    const missingLocationIds = uniqueLocationIds.filter(
        (id) => !foundLocationIds.has(id)
    )
    if (missingLocationIds.length > 0) {
        return {
            valid: false,
            message: `The selected delivery location is unavailable. Please update your delivery preference.`,
        }
    }

    // Create maps for efficient lookup
    const foodItemMap = new Map(foodItems.map((f) => [f.id, f]))
    const locationMap = new Map(customerLocations.map((l) => [l.id, l]))

    // Verify food item is available in the customer's location area
    for (const item of items) {
        const foodItem = foodItemMap.get(item.foodItemId)
        const customerLocation = locationMap.get(item.deliveryLocationId)

        if (!foodItem || !customerLocation) continue

        const isAvailableInArea = foodItem.locations.some(
            (floc) => floc.areaId === customerLocation.areaId
        )

        if (!isAvailableInArea) {
            return {
                valid: false,
                message: `The selected food item ("${foodItem.name}") is not available for the chosen delivery location. Kindly select a different item.`,
            }
        }
    }

    return { valid: true }
}

// Generate unique order number
export const generateOrderNumber = async () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    // Use proper date boundaries
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Count orders created today
    const todayOrderCount = await prisma.order.count({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    })

    const sequence = String(todayOrderCount + 1).padStart(4, '0')
    return `ORD${year}${month}${day}${sequence}`
}
