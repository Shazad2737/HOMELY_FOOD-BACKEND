import { prisma } from '../../../config/database.js'
import { prepareEnumsForView } from '../../utils/enumHelper.js'
import { logger } from '../../utils/logger.js'
import { cleanupTempFile, deleteMedia, uploadMedia } from '../../utils/media.js'
import { Enums } from '../../utils/prismaEnums.js'

export const listBanners = async (req, res) => {
    res.render('admin/banner/list', {
        title: 'Banners',
        user: req.user,
    })
}

export const renderAddEditBanner = async (req, res) => {
    const { id } = req.params
    const isEdit = Boolean(id)

    const banner = isEdit
        ? await prisma.banner.findUnique({
              where: { id },
              include: {
                  images: { orderBy: { sortOrder: 'asc' } },
                  brand: true,
              },
          })
        : null

    if (isEdit && !banner) {
        return res.status(404).render('error/404', {
            error: 'Banner not found',
        })
    }

    const placements = prepareEnumsForView({
        BannerPlacement: Enums.BannerPlacement,
    }).BannerPlacement.map((value) => ({
        value,
        label: value
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase()),
    }))

    res.render('admin/banner/add-edit', {
        title: isEdit ? 'Edit Banner' : 'Add Banner',
        banner,
        placements,
    })
}

export const saveBanner = async (req, res) => {
    const {
        id,
        placement,
        title,
        description,
        isActive = true,
        images = [],
        deletedImages = [],
    } = req.body

    const brandId = req.session.brandId

    const parsedImages = Array.isArray(images) ? images : []
    const parsedDeletedImages = Array.isArray(deletedImages)
        ? deletedImages
        : []

    const baseData = {
        brandId,
        placement,
        title: title?.trim() || null,
        description: description?.trim() || null,
        isActive: isActive === 'true' || isActive === true,
    }

    await prisma.$transaction(async (tx) => {
        if (baseData.isActive) {
            await tx.banner.updateMany({
                where: {
                    brandId: baseData.brandId,
                    placement: baseData.placement,
                    isActive: true,
                    ...(id && { NOT: { id } }),
                },
                data: { isActive: false },
            })
        }

        if (id) {
            const existingBanner = await tx.banner.findUnique({
                where: { id },
                include: { images: true },
            })

            if (!existingBanner) {
                throw new Error('Banner not found')
            }

            await tx.bannerImage.deleteMany({ where: { bannerId: id } })

            await tx.banner.update({
                where: { id },
                data: {
                    ...baseData,
                    updatedAt: new Date(),
                    images: {
                        create: parsedImages.map((img, index) => ({
                            imageUrl: img.imageUrl.trim(),
                            redirectUrl: img.redirectUrl?.trim() || null,
                            caption: img.caption?.trim() || null,
                            sortOrder: parseInt(img.sortOrder || index, 10),
                            isActive:
                                img.isActive === 'true' ||
                                img.isActive === true,
                        })),
                    },
                },
            })
        } else {
            await tx.banner.create({
                data: {
                    ...baseData,
                    images: {
                        create: parsedImages.map((img, index) => ({
                            imageUrl: img.imageUrl.trim(),
                            redirectUrl: img.redirectUrl?.trim() || null,
                            caption: img.caption?.trim() || null,
                            sortOrder: parseInt(img.sortOrder || index, 10),
                            isActive:
                                img.isActive === 'true' ||
                                img.isActive === true,
                        })),
                    },
                },
            })
        }
    })

    if (parsedDeletedImages.length > 0) {
        Promise.all(parsedDeletedImages.map((url) => deleteMedia(url))).catch(
            (err) => {
                logger.error(
                    `Failed to delete some banner images from storage: ${err.message}`
                )
            }
        )
    }

    return res.json({
        success: true,
        message: id
            ? 'Banner updated successfully'
            : 'Banner created successfully',
    })
}

export const bannerImageUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No file to upload.',
            })
        }

        const file = req.files[0]

        const result = await uploadMedia(null, 'Banner', file)
        cleanupTempFile(file.path)

        if (!result || !result.url) {
            return res.status(400).json({
                success: false,
                error: 'Failed to upload image file. No URL returned.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Image upload successful.',
            url: result.url,
        })
    } catch (error) {
        logger.error(error)
        if (req.files && req.files[0]?.path) cleanupTempFile(req.files[0].path)

        return res.status(500).json({
            success: false,
            error: 'Server error during image upload.',
        })
    }
}

export const toggleBannerStatus = async (req, res) => {
    const { id } = req.params

    const banner = await prisma.banner.findUnique({ where: { id } })

    if (!banner) {
        return res.status(404).json({
            success: false,
            error: 'Banner not found',
        })
    }

    await prisma.banner.update({
        where: { id },
        data: { isActive: !banner.isActive },
    })

    return res.json({
        success: true,
        message: `Banner ${
            !banner.isActive ? 'activated' : 'deactivated'
        } successfully`,
    })
}

export const deleteBanner = async (req, res) => {
    const { id } = req.params

    const banner = await prisma.banner.findUnique({
        where: { id },
        include: { images: true },
    })

    if (!banner) {
        return res.status(404).json({
            success: false,
            error: 'Banner not found',
        })
    }

    const imageUrls = banner.images.map((img) => img.imageUrl).filter(Boolean)

    await prisma.banner.delete({
        where: { id },
    })

    if (imageUrls.length > 0) {
        Promise.all(imageUrls.map((url) => deleteMedia(url))).catch((err) => {
            logger.error(
                `Failed to delete some banner images from storage: ${err.message}`
            )
        })
    }

    return res.json({
        success: true,
        message: 'Banner deleted successfully',
    })
}

export const getBannersDataTable = async (req, res) => {
    try {
        const { start = 0, length = 10, draw, placement, status } = req.query

        const skip = parseInt(start)
        const take = parseInt(length)

        // Build where clause
        const where = {
            brandId: req.session.brandId,
        }

        // Add placement filter
        if (placement) {
            where.placement = placement
        }

        // Add status filter
        if (status !== undefined && status !== '') {
            where.isActive = status === 'true'
        }

        // Build order
        const orderColumn = parseInt(req.query['order[0][column]'] || 1)
        const orderDir = req.query['order[0][dir]'] || 'asc'

        let orderBy = { sortOrder: 'asc' }

        switch (orderColumn) {
            case 0:
                orderBy = { placement: orderDir }
                break
            case 1:
                orderBy = { title: orderDir }
                break
            case 3:
                orderBy = { isActive: orderDir }
                break
            default:
                orderBy = { sortOrder: 'asc' }
        }

        const [banners, totalRecords] = await Promise.all([
            prisma.banner.findMany({
                where,
                include: {
                    images: {
                        select: {
                            id: true,
                            imageUrl: true,
                            sortOrder: true,
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
                orderBy,
                skip,
                take,
            }),
            prisma.banner.count({ where }),
        ])

        return res.json({
            draw: parseInt(draw || 1),
            recordsTotal: totalRecords,
            recordsFiltered: totalRecords,
            data: banners,
        })
    } catch (error) {
        logger.error('Error fetching banners for DataTable:', error)
        return res.status(500).json({
            draw: parseInt(req.query.draw || 1),
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
            error: 'Failed to fetch banners',
        })
    }
}
