import { prisma } from '../../../config/database.js'
import { logger } from '../../utils/logger.js'
import { cleanupTempFile, deleteMedia, uploadMedia } from '../../utils/media.js'

export const listCategories = async (req, res) => {
    res.render('admin/category/list')
}

export const getCategoriesJson = async (req, res) => {
    try {
        const { start = 0, length = 50, search, order } = req.query
        const skip = parseInt(start)
        const take = parseInt(length)
        const searchValue = search?.value || ''

        const columns = []
        for (let i = 0; req.query[`columns[${i}][data]`]; i++) {
            columns.push({
                data: req.query[`columns[${i}][data]`],
                searchValue: req.query[`columns[${i}][search][value]`],
            })
        }

        const where = {}

        // if (searchValue) {
        //     where.OR = [
        //         { name: { contains: searchValue, mode: 'insensitive' } },
        //         { description: { contains: searchValue, mode: 'insensitive' } },
        //     ]
        // }

        // Column-based filters
        // const statusFilter = columns.find(
        //     (col) => col.data === 'isActive'
        // )?.searchValue
        // if (statusFilter) {
        //     where.isActive = statusFilter === 'active'
        // }

        // Sort handling
        let orderBy = { createdAt: 'desc' }
        if (req.query['order[0][column]']) {
            const columnIndex = req.query['order[0][column]']
            const dir = req.query['order[0][dir]'] || 'desc'
            const columnName = columns[columnIndex]?.data
            if (columnName) orderBy = { [columnName]: dir }
        }

        const [data, recordsFiltered, recordsTotal] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take,
                include: {
                    _count: { select: { plans: true, CategoryLocation: true } },
                    // AreaCategory: { include: { area: true } },
                },
                orderBy,
            }),
            prisma.category.count({ where }),
            prisma.category.count(),
        ])

        // Return formatted JSON
        res.json({
            draw: parseInt(req.query.draw),
            recordsTotal,
            recordsFiltered,
            data,
        })
    } catch (error) {
        console.error('❌ Category JSON Error:', error)
        res.status(500).json({ error: 'Failed to fetch categories' })
    }
}

export const categoryFormPage = async (req, res) => {
    const { id } = req.params
    const brandId = req.session.brandId

    let category = null
    let title = 'Add Category'

    const areas = await prisma.area.findMany({
        // where: { brandId },
        // where: { isActive: true },
        include: {
            location: true,
        },
        orderBy: { name: 'asc' },
    })

    if (id) {
        category = await prisma.category.findUnique({
            where: { id },
            include: {
                CategoryLocation: { include: { area: true } },
                // AreaCategory: { include: { area: { include: { location: true } } } },
            },
        })

        if (!category) {
            return res.status(404).json({ error: 'Category not found' })
        }

        title = 'Edit Category'
    }

    res.render('admin/category/add-edit', {
        title,
        category,
        areas,
    })
}

export const categoryImageUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No file to upload.',
            })
        }

        const file = req.files[0]

        const result = await uploadMedia(null, 'Category', file)
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
        logger.error('category image upload error:', error)
        if (req.files && req.files[0]?.path) cleanupTempFile(req.files[0].path)

        return res.status(500).json({
            success: false,
            message: 'Server error during image upload.',
        })
    }
}

export const saveCategory = async (req, res) => {
    const { id, name, description, sortOrder, areas = [], imageUrl } = req.body
    const brandId = req.session.brandId

    // Common validation — ensure name & brand combination is unique
    const existingSameName = await prisma.category.findFirst({
        where: {
            brandId,
            name: name.trim(),
            ...(id ? { NOT: { id } } : {}), // exclude current record on update
        },
    })

    if (existingSameName) {
        return res.status(400).json({
            success: false,
            error: 'Category name already exists',
        })
    }

    let category

    // UPDATE FLOW
    if (id) {
        const existingCategory = await prisma.category.findUnique({
            where: { id },
        })
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                error: 'Category not found',
            })
        }

        category = await prisma.category.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description || null,
                imageUrl: imageUrl || null,
                sortOrder: parseInt(sortOrder) || 0,
            },
        })

        // Remove old mappings
        await prisma.categoryLocation.deleteMany({ where: { categoryId: id } })

        // Create new mappings
        if (Array.isArray(areas) && areas.length > 0) {
            const areaRecords = await prisma.area.findMany({
                where: { id: { in: areas } },
                select: { id: true, locationId: true },
            })

            await prisma.categoryLocation.createMany({
                data: areaRecords.map((a) => ({
                    categoryId: id,
                    areaId: a.id,
                    locationId: a.locationId || null,
                })),
                skipDuplicates: true,
            })
        }

        // Delete old image if replaced
        if (
            existingCategory.imageUrl &&
            existingCategory.imageUrl !== imageUrl
        ) {
            await deleteMedia(existingCategory.imageUrl)
        }

        return res.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        })
    }

    // CREATE FLOW
    category = await prisma.category.create({
        data: {
            name: name.trim(),
            description: description || null,
            brandId,
            sortOrder: parseInt(sortOrder) || 0,
            imageUrl: imageUrl || null,
            isActive: true,
        },
    })

    if (Array.isArray(areas) && areas.length > 0) {
        const areaRecords = await prisma.area.findMany({
            where: { id: { in: areas } },
            select: { id: true, locationId: true },
        })

        await prisma.categoryLocation.createMany({
            data: areaRecords.map((a) => ({
                categoryId: category.id,
                areaId: a.id,
                locationId: a.locationId || null,
            })),
            skipDuplicates: true,
        })
    }

    return res.json({
        success: true,
        message: 'Category created successfully',
        data: category,
    })
}

export const toggleStatus = async (req, res) => {
    const { id } = req.params

    const category = await prisma.category.findUnique({ where: { id } })

    await prisma.category.update({
        where: { id },
        data: { isActive: !category.isActive },
    })

    res.json({ success: true, message: 'Status updated successfully' })
}
