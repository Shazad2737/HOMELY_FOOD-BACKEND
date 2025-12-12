import { prisma } from '../../../config/database.js'
import { getHolidaysFromCache } from '../../utils/cache.js'
import { prepareEnumsForView } from '../../utils/enumHelper.js'
import { logger } from '../../utils/logger.js'
import { cleanupTempFile, deleteMedia, uploadMedia } from '../../utils/media.js'
import { Enums } from '../../utils/prismaEnums.js'

export const listFoodItems = async (req, res) => {
    res.render('admin/fooditem/list', {
        title: 'Food Items',
    })
}

export const getFoodItemsJson = async (req, res) => {
    try {
        const draw = Number(req.query.draw) || 0
        const start = Number(req.query.start) || 0
        const length = Number(req.query.length) || 50
        const searchValue = req.query['search[value]']?.trim() || ''

        const orderColumnIndex = req.query['order[0][column]']
        const orderDir =
            (req.query['order[0][dir]'] || 'desc').toLowerCase() === 'asc'
                ? 'asc'
                : 'desc'

        // Helper to read DataTables column search
        const columnSearch = (i) =>
            (req.query[`columns[${i}][search][value]`] || '').trim()

        const where = {}

        // --- Global Search ---
        if (req.query.searchValue) {
            const s = req.query.searchValue.trim()
            where.OR = [
                { name: { contains: s, mode: 'insensitive' } },
                { code: { contains: s, mode: 'insensitive' } },
                { description: { contains: s, mode: 'insensitive' } },
            ]
        }
        // --- Column or extra filters ---
        const mealTypeId = req.query.mealTypeId || columnSearch(2) || undefined
        if (mealTypeId) where.mealTypeId = mealTypeId

        const status = req.query.status || columnSearch(4) || ''
        if (status) {
            if (status === 'active') where.isActive = true
            else if (status === 'inactive') where.isActive = false
        }

        let orderBy = { createdAt: 'desc' }

        if (orderColumnIndex !== undefined) {
            const colIndex = parseInt(orderColumnIndex)
            const colData = req.query[`columns[${colIndex}][data]`] || ''

            const orderMap = {
                name: (dir) => ({ name: dir }),
                code: (dir) => ({ code: dir }),
                'mealType.name': (dir) => ({ mealType: { name: dir } }),
                isActive: (dir) => ({ isActive: dir }),
                createdAt: (dir) => ({ createdAt: dir }),
            }

            orderBy =
                orderMap[colData]?.(orderDir) ||
                (colIndex === 2
                    ? { mealType: { name: orderDir } }
                    : { createdAt: 'desc' })
        }

        const [data, recordsFiltered, recordsTotal] = await Promise.all([
            prisma.foodItem.findMany({
                where,
                skip: start,
                take: length,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    code: true,
                    description: true,
                    imageUrl: true,
                    isActive: true,
                    isVegetarian: true,
                    isVegan: true,
                    createdAt: true,
                    mealType: {
                        select: { id: true, name: true, type: true },
                    },
                    availableDays: {
                        select: { dayOfWeek: true },
                        orderBy: { dayOfWeek: 'asc' },
                    },
                    _count: { select: { orderItems: true } },
                },
            }),
            prisma.foodItem.count({ where }),
            prisma.foodItem.count(),
        ])

        return res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data,
        })
    } catch (error) {
        console.error('❌ Error fetching food items:', error)
        return res.status(500).json({
            draw: Number(req.query.draw) || 0,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
            error: 'Error fetching food items',
        })
    }
}

export const foodItemFormPage = async (req, res) => {
    const { id } = req.params
    const brandId = req.session.brandId
    const isEdit = Boolean(id)

    const [mealTypes, categories, areas, foodItem, recurringHolidays] =
        await Promise.all([
            prisma.mealType.findMany({
                where: { isActive: true },
                select: { id: true, name: true },
                orderBy: { sortOrder: 'asc' },
            }),
            prisma.category.findMany({
                where: { isActive: true },
                select: { id: true, name: true },
                orderBy: { sortOrder: 'asc' },
            }),
            prisma.area.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    location: { select: { name: true } },
                },
                orderBy: { name: 'asc' },
            }),
            isEdit
                ? prisma.foodItem.findUnique({
                      where: { id },
                      include: {
                          availableDays: { select: { dayOfWeek: true } },
                          planAvailability: { select: { planId: true } },
                          locations: { select: { areaId: true } },
                          category: { select: { id: true } },
                      },
                  })
                : null,
            getHolidaysFromCache(brandId),
        ])

    if (isEdit && !foodItem) {
        return res
            .status(404)
            .render('error/404', { error: 'Food item not found' })
    }

    const processedFoodItem = foodItem
        ? {
              ...foodItem,
              selectedAreaIds: foodItem.locations.map((l) => l.areaId),
              selectedPlanIds: foodItem.planAvailability.map((p) => p.planId),
          }
        : null

    const recurringWeeklyHolidays = recurringHolidays
        .filter((h) => h.type === 'RECURRING_WEEKLY' && h.dayOfWeek)
        .map((h) => h.dayOfWeek)

    const enums = prepareEnumsForView(Enums)

    return res.render('admin/fooditem/add-edit', {
        title: `${isEdit ? 'Edit' : 'Add'} Food Item`,
        mealTypes,
        categories,
        areas,
        foodItem: processedFoodItem,
        enums,
        isEdit,
        recurringWeeklyHolidays,
    })
}

export const saveFoodItem = async (req, res) => {
    const {
        id,
        name,
        code,
        description,
        mealTypeId,
        categoryId,
        cuisine,
        style,
        price = 0,
        isVegetarian,
        isVegan,
        availableDays,
        planIds,
        areaIds,
        imageUrl,
        deliveryMode,
        deliverWithId,
    } = req.body

    if (deliveryMode === 'WITH_OTHER' && !deliverWithId) {
        return res.status(400).json({
            error: 'You must select a food item to deliver with when "With Other" is chosen.',
        })
    }

    const parseArray = (val) => {
        if (!val) return []
        return Array.isArray(val) ? val : [val]
    }

    const parsedAvailableDays = parseArray(availableDays)
    const parsedPlanIds = parseArray(planIds)
    const parsedAreaIds = parseArray(areaIds)

    const baseData = {
        name: name.trim(),
        code: code.trim(),
        description: description?.trim() || null,
        cuisine,
        style,
        price: parseFloat(price),
        isVegetarian: isVegetarian === 'true' || isVegetarian === true,
        isVegan: isVegan === 'true' || isVegan === true,
        deliveryMode: deliveryMode || 'SEPARATE',
        imageUrl: imageUrl?.trim() || null,
    }

    // --- UPDATE FLOW ---
    if (id) {
        const existingItem = await prisma.foodItem.findUnique({ where: { id } })
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                error: 'Food item not found',
            })
        }

        const duplicateCode = await prisma.foodItem.findFirst({
            where: { code: code.trim(), mealTypeId, id: { not: id } },
        })
        if (duplicateCode) {
            return res.status(400).json({
                success: false,
                error: `Food item with code "${code}" already exists for this meal type`,
            })
        }

        await prisma.$transaction(async (tx) => {
            // Delete old relational data
            await Promise.all([
                tx.foodItemAvailability.deleteMany({
                    where: { foodItemId: id },
                }),
                tx.FoodItemPlan.deleteMany({ where: { foodItemId: id } }),
                tx.foodItemLocation.deleteMany({ where: { foodItemId: id } }),
            ])

            const areaRecords = await tx.area.findMany({
                where: { id: { in: parsedAreaIds } },
                select: { id: true, locationId: true },
            })

            // Update main record
            await tx.foodItem.update({
                where: { id },
                data: {
                    ...baseData,
                    updatedAt: new Date(),
                    availableDays: {
                        create: parsedAvailableDays.map((day) => ({
                            dayOfWeek: day,
                        })),
                    },
                    category: { connect: { id: categoryId } },
                    planAvailability: {
                        create: parsedPlanIds.map((planId) => ({ planId })),
                    },
                    mealType: { connect: { id: mealTypeId } },
                    deliverWith: deliverWithId
                        ? { connect: { id: deliverWithId } }
                        : undefined,
                    locations: {
                        create: areaRecords.map((a) => ({
                            areaId: a.id,
                            locationId: a.locationId || null,
                        })),
                    },
                },
            })
        })

        // Delete old image if replaced
        if (
            existingItem.imageUrl &&
            existingItem.imageUrl !== imageUrl &&
            imageUrl?.trim()
        ) {
            logger.info(
                `Deleting image for food item: ${existingItem.imageUrl}`
            )
            await deleteMedia(existingItem.imageUrl)
        }

        return res.json({
            success: true,
            message: 'Food item updated successfully',
        })
    }

    // --- CREATE FLOW ---
    const duplicateCode = await prisma.foodItem.findFirst({
        where: { code: code.trim(), mealTypeId },
    })
    if (duplicateCode) {
        return res.status(400).json({
            success: false,
            error: `Food item with code "${code}" already exists for this meal type`,
        })
    }

    const areaRecords = await prisma.area.findMany({
        where: { id: { in: parsedAreaIds } },
        select: { id: true, locationId: true },
    })

    await prisma.foodItem.create({
        data: {
            ...baseData,
            isActive: true,
            availableDays: {
                create: parsedAvailableDays.map((day) => ({ dayOfWeek: day })),
            },
            category: { connect: { id: categoryId } },
            planAvailability: {
                create: parsedPlanIds.map((planId) => ({ planId })),
            },
            mealType: { connect: { id: mealTypeId } },
            deliverWith: deliverWithId
                ? { connect: { id: deliverWithId } }
                : undefined,
            locations: {
                create: areaRecords.map((a) => ({
                    areaId: a.id,
                    locationId: a.locationId || null,
                })),
            },
        },
    })

    return res.json({
        success: true,
        message: 'Food item created successfully',
    })
}

export const foodItemImageUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No file to upload.',
            })
        }

        const file = req.files[0]

        const result = await uploadMedia(null, 'FoodItem', file)
        cleanupTempFile(file.path)

        if (!result || !result.url) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload media file. No URL returned.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Image upload successful.',
            url: result.url,
        })
    } catch (error) {
        logger.error('Food item image upload error: ', error)
        if (req.files && req.files[0]?.path) cleanupTempFile(req.files[0].path)

        return res.status(500).json({
            success: false,
            message: 'Server error during image upload.',
        })
    }
}

export const toggleStatus = async (req, res) => {
    const { id } = req.params

    const foodItem = await prisma.foodItem.findUnique({
        where: { id },
        select: { isActive: true, name: true },
    })

    if (!foodItem) {
        return res.status(404).json({
            success: false,
            message: 'Food item not found',
        })
    }

    await prisma.foodItem.update({
        where: { id },
        data: { isActive: !foodItem.isActive },
    })

    const newStatus = !foodItem.isActive ? 'activated' : 'deactivated'

    res.json({
        success: true,
        message: `Food item ${newStatus} successfully`,
        isActive: !foodItem.isActive,
    })
}

export const deleteFoodItem = async (req, res) => {
    const { id } = req.params

    try {
        const foodItem = await prisma.foodItem.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                _count: {
                    select: {
                        orderItems: true,
                    },
                },
            },
        })

        if (!foodItem) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
            })
        }

        if (foodItem._count.orderItems > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete food item "${foodItem.name}" as it is used in ${foodItem._count.orderItems} order(s). Consider deactivating instead.`,
            })
        }

        if (foodItem.imageUrl) {
            logger.info(`Deleting image for food item: ${foodItem.imageUrl}`)
            await deleteMedia(foodItem.imageUrl)
        }

        await prisma.$transaction(async (tx) => {
            await Promise.all([
                tx.foodItemAvailability.deleteMany({
                    where: { foodItemId: id },
                }),
                tx.FoodItemPlan.deleteMany({ where: { foodItemId: id } }),
                tx.foodItemLocation.deleteMany({ where: { foodItemId: id } }),
            ])

            await tx.foodItem.delete({ where: { id } })
        })

        res.json({
            success: true,
            message: 'Food item deleted successfully',
        })
    } catch (error) {
        logger.error(`Error deleting food item:, ${error}`)

        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message:
                    'Cannot delete food item as it is referenced by other records. Consider deactivating instead.',
            })
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting food item. Please try again.',
        })
    }
}

export const getPlansByCategory = async (req, res) => {
    const { categoryId } = req.query

    if (!categoryId) {
        return res.json({ success: false, message: 'Category ID missing' })
    }

    const plans = await prisma.plan.findMany({
        where: { categoryId, isActive: true },
        select: { id: true, name: true },
        orderBy: { sortOrder: 'asc' },
    })

    return res.json({ success: true, plans })
}
