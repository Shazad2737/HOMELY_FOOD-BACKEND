import { prisma } from '../../../config/database.js'
import { envConfig } from '../../../config/env.js'
import { removeCache } from '../../../config/redis.js'
import { keyEnums } from '../../utils/cache.js'
import { Enums } from '../../utils/prismaEnums.js'

export const getBrandSettings = async (req, res) => {
    const brandId = req.session.brandId

    // Fetch existing settings or create default
    let settings = await prisma.brandSettings.findUnique({
        where: { brandId },
    })

    if (!settings) {
        settings = await prisma.brandSettings.create({
            data: {
                brandId,
                advanceOrderCutoffHour:
                    envConfig.order.ADVANCE_ORDER_CUTOFF_HOUR,
                minAdvanceOrderDays: envConfig.order.MAX_ADVANCE_ORDER_DAYS,
                maxAdvanceOrderDays: envConfig.order.MAX_ADVANCE_ORDER_DAYS,
            },
        })
    }

    res.render('admin/settings/brand-settings', { settings })
}

export const saveBrandSettings = async (req, res) => {
    const brandId = req.session.brandId

    const {
        id,
        advanceOrderCutoffHour,
        minAdvanceOrderDays,
        maxAdvanceOrderDays,
        whatsappNumber,
        phoneNumber,
        helpCenterUrl,
        termsAndConditions,
        privacyPolicy,
        isActive,
    } = req.body

    // Prepare data
    const data = {
        advanceOrderCutoffHour: parseInt(advanceOrderCutoffHour),
        minAdvanceOrderDays: parseInt(minAdvanceOrderDays),
        maxAdvanceOrderDays: parseInt(maxAdvanceOrderDays),
        whatsappNumber: whatsappNumber || null,
        phoneNumber: phoneNumber || null,
        helpCenterUrl: helpCenterUrl || null,
        termsAndConditions: termsAndConditions || null,
        privacyPolicy: privacyPolicy || null,
        isActive: isActive === 'true',
    }

    let settings

    if (id) {
        settings = await prisma.brandSettings.update({
            where: { id },
            data,
        })
    } else {
        settings = await prisma.brandSettings.upsert({
            where: { brandId },
            update: data,
            create: {
                ...data,
                brandId,
            },
        })
    }

    await removeCache([keyEnums.headers.brand])

    res.json({
        success: true,
        message: 'Settings saved successfully',
        data: settings,
    })
}

export const getMealType = async (req, res) => {
    const mealTypes = await prisma.mealType.findMany({
        orderBy: { sortOrder: 'asc' },
    })

    res.render('admin/settings/meal-types', { mealTypes })
}

export const updateMealType = async (req, res) => {
    const { mealTypes } = req.body

    await Promise.all(
        mealTypes.map((mt) =>
            prisma.mealType.update({
                where: { id: mt.id },
                data: {
                    name: mt.name,
                    description: mt.description || null,
                    startTime: mt.startTime,
                    endTime: mt.endTime,
                    isActive: mt.isActive === 'true',
                    sortOrder: parseInt(mt.sortOrder),
                },
            })
        )
    )

    res.json({ success: true, message: 'Settings saved successfully' })
}
