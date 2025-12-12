import redisClient from '../../../config/redis.js'
import { prisma } from '../../../config/database.js'
import { apiResponse } from '../../utils/responseHandler.js'
import { CustomError } from '../../utils/customError.js'

export const getMenuPage = async (req, res) => {
    const { categoryId } = req.params
    const { planId, search } = req.query
    const customerId = req.user.id

    // === Get customer areas ===
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
            locations: { select: { areaId: true } },
        },
    })

    if (!customer) {
        throw new CustomError(404, 'Customer not found')
    }

    const customerAreaIds = (customer.locations || [])
        .map((l) => l.areaId)
        .filter(Boolean)

    // === Fetch plans ===
    const availablePlans = await prisma.plan.findMany({
        where: {
            categoryId,
            isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            name: true,
            type: true,
            imageUrl: true,
        },
    })

    // === Fetch meal types ===
    const mealTypes = await prisma.mealType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            type: true,
            name: true,
            description: true,
            startTime: true,
            endTime: true,
            sortOrder: true,
        },
    })

    // === Build search filter ===
    const searchCondition = search
        ? {
              OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                  { code: { contains: search, mode: 'insensitive' } },
                  { cuisine: { contains: search, mode: 'insensitive' } },
                  { style: { contains: search, mode: 'insensitive' } },
              ],
          }
        : {}

    // === Fetch menu items grouped by meal type ===
    const menuData = {}

    await Promise.all(
        mealTypes.map(async (mealType) => {
            const whereCondition = {
                categoryId,
                mealTypeId: mealType.id,
                isActive: true,
                planAvailability: { some: { planId } },
                ...searchCondition,
            }

            if (customerAreaIds.length > 0) {
                whereCondition.locations = {
                    some: { areaId: { in: customerAreaIds } },
                }
            }

            const foodItems = await prisma.foodItem.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    imageUrl: true,
                    cuisine: true,
                    style: true,
                    price: true,
                    isVegetarian: true,
                    isVegan: true,
                    deliveryMode: true,
                    deliverWith: {
                        select: { id: true, name: true, type: true },
                    },
                    availableDays: {
                        select: { dayOfWeek: true },
                        orderBy: { dayOfWeek: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            })

            menuData[mealType.type.toLowerCase()] = foodItems
        })
    )

    return apiResponse.success(res, 'Menu data fetched successfully', {
        availablePlans,
        mealTypes,
        menu: menuData,
    })
}
