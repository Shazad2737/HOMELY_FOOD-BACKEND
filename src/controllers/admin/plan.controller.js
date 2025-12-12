import { prisma } from '../../../config/database.js'
import { cleanupTempFile, deleteMedia, uploadMedia } from '../../utils/media.js'
import { Enums } from '../../utils/prismaEnums.js'

export const listPlans = async (req, res) => {
    res.render('admin/plan/list', {
        title: 'Plans',
    })
}

export const getPlansJson = async (req, res) => {
    const { start, length, search } = req.query
    const skip = parseInt(start) || 0
    const take = parseInt(length) || 50
    const searchValue = req.query['search[value]'] || ''

    const where = {}
    if (searchValue) {
        where.OR = [
            { name: { contains: searchValue, mode: 'insensitive' } },
            { description: { contains: searchValue, mode: 'insensitive' } },
        ]
    }

    // Type filter
    const typeValue = req.query['columns[2][search][value]']
    if (typeValue) {
        where.type = typeValue
    }

    // Status filter
    const statusValue = req.query['columns[4][search][value]']
    if (statusValue) {
        where.isActive = statusValue === 'active'
    }

    const [data, recordsFiltered, totalRecords] = await Promise.all([
        prisma.plan.findMany({
            where,
            skip,
            take,
            include: { category: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.plan.count({ where }),
        prisma.plan.count(),
    ])

    res.json({
        draw: parseInt(req.query.draw),
        recordsTotal: totalRecords,
        recordsFiltered,
        data,
    })
}

export const addEditPlanPage = async (req, res) => {
    const { id } = req.params

    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { sortOrder: 'asc' },
    })

    let plan = null
    let title = 'Add Plan'

    if (id) {
        plan = await prisma.plan.findUnique({
            where: { id },
        })

        if (!plan) {
            return res.status(404).render('error', { error: 'Plan not found' })
        }

        title = 'Edit Plan'
    }

    res.render('admin/plan/add-edit', {
        title,
        categories,
        plan,
        planTypes: Enums.PlanType,
    })
}

export const planImageUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No file to upload.',
            })
        }

        const file = req.files[0]

        const result = await uploadMedia(null, 'Plans', file)
        cleanupTempFile(file.path)

        if (!result || !result.url) {
            return res.status(400).json({
                success: false,
                error: 'Failed to upload media file. No URL returned.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Image upload successful.',
            url: result.url,
        })
    } catch (error) {
        logger.error('Plan image upload', error)
        if (req.files && req.files[0]?.path) cleanupTempFile(req.files[0].path)

        return res.status(500).json({
            success: false,
            error: 'Server error during image upload.',
        })
    }
}

export const savePlan = async (req, res) => {
    const {
        id,
        name,
        type,
        categoryId,
        description,
        imageUrl,
        isActive = true,
        isUnlimited = false,
        sortOrder = 0,
    } = req.body

    if (!name || !type || !categoryId) {
        return res.status(400).json({
            success: false,
            error: 'Name, Type, and Category are required.',
        })
    }

    const finalIsUnlimited =
        type === 'ULTIMATE'
            ? true
            : isUnlimited === 'true' || isUnlimited === true

    let plan

    if (id) {
        const existingPlan = await prisma.plan.findUnique({ where: { id } })
        if (!existingPlan) {
            return res
                .status(404)
                .json({ success: false, error: 'Plan item not found' })
        }

        plan = await prisma.plan.update({
            where: { id },
            data: {
                name,
                type,
                categoryId,
                description: description || null,
                imageUrl: imageUrl || '',
                isActive: isActive === 'true' || isActive === true,
                isUnlimited: finalIsUnlimited,
                sortOrder: parseInt(sortOrder) || 0,
                updatedAt: new Date(),
            },
        })

        if (existingPlan.imageUrl !== imageUrl) {
            await deleteMedia(existingPlan.imageUrl)
        }
    } else {
        plan = await prisma.plan.create({
            data: {
                name,
                type,
                categoryId,
                description: description || null,
                imageUrl: imageUrl || '',
                isActive: isActive === 'true' || isActive === true,
                isUnlimited: finalIsUnlimited,
                sortOrder: parseInt(sortOrder) || 0,
            },
        })
    }

    res.json({
        success: true,
        message: id ? 'Plan updated successfully' : 'Plan created successfully',
        data: plan,
    })
}
