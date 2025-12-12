import { prisma } from '../../../config/database.js'
import { envConfig } from '../../../config/env.js'
import { setCache, removeCache, getCache } from '../../../config/redis.js'
import { CustomError } from '../../utils/customError.js'
import { apiResponse } from '../../utils/responseHandler.js'
import { uploadMedia, deleteMedia, cleanupTempFile } from '../../utils/media.js'
import {
    CustomerProfileResource,
    CustomerBasicInfoResource,
    CustomerAddressResource,
    CustomerAddressListResource,
} from '../../resources/customer.resource.js'

export const getProfile = async (req, res) => {
    const customerId = req.user?.id

    const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-profile-${customerId}`
    const cached = await getCache(cacheKey)

    if (cached) {
        return apiResponse.success(res, 'Profile fetched successfully', cached)
    }

    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            profileUrl: true,
            customerCode: true,
            status: true,
            isVerified: true,
            locations: {
                where: {
                    isDefault: true,
                    isDeleted: false,
                },
                take: 1,
                include: {
                    country: {
                        select: { id: true, name: true, code: true },
                    },
                    location: {
                        select: { id: true, name: true, code: true },
                    },
                    area: {
                        select: { id: true, name: true },
                    },
                },
            },
            _count: {
                select: {
                    orders: true,
                    subscriptions: true,
                    locations: {
                        where: { isDeleted: false },
                    },
                },
            },
        },
    })

    if (!customer) {
        throw new CustomError(404, 'Customer not found')
    }

    const formattedData = new CustomerProfileResource(customer).exec()

    // Cache for 5 minutes
    await setCache(cacheKey, formattedData, 300)

    return apiResponse.success(
        res,
        'Profile fetched successfully',
        formattedData
    )
}

export const updateProfilePicture = async (req, res) => {
    const customerId = req.user?.id

    if (!req.file) {
        throw new CustomError(400, 'Profile picture is required')
    }

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { profileUrl: true },
        })

        const result = await uploadMedia(
            req.file.buffer,
            'customers/profiles',
            {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
            },
            {
                // ImageKit transformation options
                transformation: {
                    width: 800,
                    height: 800,
                    quality: 85,
                },
            }
        )

        if (!result || !result.url) {
            throw new CustomError(500, 'Failed to upload profile picture')
        }

        if (customer?.profileUrl) {
            await deleteMedia(customer.profileUrl)
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id: customerId },
            data: { profileUrl: result.url },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                profileUrl: true,
                customerCode: true,
                status: true,
                isVerified: true,
            },
        })

        const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-profile-${customerId}`
        await removeCache([cacheKey])

        if (req.file.path) {
            cleanupTempFile(req.file.path)
        }

        return apiResponse.success(
            res,
            'Profile picture updated successfully',
            new CustomerBasicInfoResource(updatedCustomer).exec()
        )
    } catch (error) {
        if (req.file?.path) {
            cleanupTempFile(req.file.path)
        }
        throw error
    }
}

export const getAddresses = async (req, res) => {
    const customerId = req.user?.id

    const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-addresses-${customerId}`
    const cached = await getCache(cacheKey)

    if (cached) {
        return apiResponse.success(
            res,
            'Addresses fetched successfully',
            cached
        )
    }

    const addresses = await prisma.customerLocation.findMany({
        where: {
            customerId,
            isDeleted: false,
        },
        include: {
            country: {
                select: { id: true, name: true, code: true },
            },
            location: {
                select: { id: true, name: true, code: true },
            },
            area: {
                select: { id: true, name: true },
            },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    const formattedData = new CustomerAddressListResource({
        addresses,
    }).exec()

    // Cache for 5 minutes
    await setCache(cacheKey, formattedData, 300)

    return apiResponse.success(
        res,
        'Addresses fetched successfully',
        formattedData
    )
}

export const createAddress = async (req, res) => {
    const customerId = req.user?.id
    const addressData = req.body

    if (addressData.locationId) {
        const location = await prisma.location.findUnique({
            where: { id: addressData.locationId, isActive: true },
        })

        if (!location) {
            throw new CustomError(404, 'Location not found or inactive')
        }
    }

    if (addressData.areaId) {
        const area = await prisma.area.findUnique({
            where: { id: addressData.areaId, isActive: true },
        })

        if (!area) {
            throw new CustomError(404, 'Area not found or inactive')
        }
    }

    if (addressData.isDefault) {
        await prisma.customerLocation.updateMany({
            where: {
                customerId,
                isDefault: true,
                isDeleted: false,
            },
            data: { isDefault: false },
        })
    } else {
        const existingCount = await prisma.customerLocation.count({
            where: {
                customerId,
                isDeleted: false,
            },
        })

        if (existingCount === 0) {
            addressData.isDefault = true
        }
    }

    const newAddress = await prisma.customerLocation.create({
        data: {
            customerId,
            type: addressData.type || 'HOME',
            name: addressData.name || null,
            roomNumber: addressData.roomNumber || null,
            buildingName: addressData.buildingName || null,
            zipCode: addressData.zipCode || null,
            mobile: addressData.mobile || null,
            latitude: addressData.latitude || null,
            longitude: addressData.longitude || null,
            isDefault: addressData.isDefault || false,
            isDeleted: false,
            countryId: addressData.countryId || null,
            locationId: addressData.locationId,
            areaId: addressData.areaId || null,
        },
        include: {
            country: {
                select: { id: true, name: true, code: true },
            },
            location: {
                select: { id: true, name: true, code: true },
            },
            area: {
                select: { id: true, name: true },
            },
        },
    })

    const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-addresses-${customerId}`
    await removeCache([cacheKey])

    return apiResponse.success(
        res,
        'Address created successfully',
        new CustomerAddressResource(newAddress).exec(),
        201
    )
}

export const updateAddress = async (req, res) => {
    const customerId = req.user?.id
    const { addressId } = req.params
    const addressData = req.body

    const existingAddress = await prisma.customerLocation.findFirst({
        where: {
            id: addressId,
            customerId,
            isDeleted: false,
        },
    })

    if (!existingAddress) {
        throw new CustomError(404, 'Address not found')
    }

    if (addressData.locationId) {
        const location = await prisma.location.findUnique({
            where: { id: addressData.locationId, isActive: true },
        })

        if (!location) {
            throw new CustomError(404, 'Location not found or inactive')
        }
    }

    if (addressData.areaId) {
        const area = await prisma.area.findUnique({
            where: { id: addressData.areaId, isActive: true },
        })

        if (!area) {
            throw new CustomError(404, 'Area not found or inactive')
        }
    }

    if (addressData.isDefault === true) {
        await prisma.customerLocation.updateMany({
            where: {
                customerId,
                id: { not: addressId },
                isDefault: true,
                isDeleted: false,
            },
            data: { isDefault: false },
        })
    }

    const updatedAddress = await prisma.customerLocation.update({
        where: { id: addressId },
        data: {
            ...(addressData.type && { type: addressData.type }),
            ...(addressData.name !== undefined && { name: addressData.name }),
            ...(addressData.roomNumber !== undefined && {
                roomNumber: addressData.roomNumber,
            }),
            ...(addressData.buildingName !== undefined && {
                buildingName: addressData.buildingName,
            }),
            ...(addressData.zipCode !== undefined && {
                zipCode: addressData.zipCode,
            }),
            ...(addressData.mobile !== undefined && {
                mobile: addressData.mobile,
            }),
            ...(addressData.latitude !== undefined && {
                latitude: addressData.latitude,
            }),
            ...(addressData.longitude !== undefined && {
                longitude: addressData.longitude,
            }),
            ...(addressData.isDefault !== undefined && {
                isDefault: addressData.isDefault,
            }),
            ...(addressData.countryId !== undefined && {
                countryId: addressData.countryId,
            }),
            ...(addressData.locationId !== undefined && {
                locationId: addressData.locationId,
            }),
            ...(addressData.areaId !== undefined && {
                areaId: addressData.areaId,
            }),
        },
        include: {
            country: {
                select: { id: true, name: true, code: true },
            },
            location: {
                select: { id: true, name: true, code: true },
            },
            area: {
                select: { id: true, name: true },
            },
        },
    })

    const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-addresses-${customerId}`
    await removeCache([cacheKey])

    return apiResponse.success(
        res,
        'Address updated successfully',
        new CustomerAddressResource(updatedAddress).exec()
    )
}

export const deleteAddress = async (req, res) => {
    const customerId = req.user?.id
    const { addressId } = req.params

    const existingAddress = await prisma.customerLocation.findFirst({
        where: {
            id: addressId,
            customerId,
            isDeleted: false,
        },
    })

    if (!existingAddress) {
        throw new CustomError(404, 'Address not found')
    }

    // Soft delete the address
    await prisma.customerLocation.update({
        where: { id: addressId },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
            isDefault: false,
        },
    })

    if (existingAddress.isDefault) {
        const remainingAddress = await prisma.customerLocation.findFirst({
            where: {
                customerId,
                isDeleted: false,
            },
            orderBy: { createdAt: 'asc' },
        })

        if (remainingAddress) {
            await prisma.customerLocation.update({
                where: { id: remainingAddress.id },
                data: { isDefault: true },
            })
        }
    }

    const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-addresses-${customerId}`
    await removeCache([cacheKey])

    const profileCacheKey = `${envConfig.cache.KEY_PREFIX}-customer-profile-${customerId}`
    await removeCache([profileCacheKey])

    return apiResponse.success(res, 'Address deleted successfully')
}

export const setDefaultAddress = async (req, res) => {
    const customerId = req.user?.id
    const { addressId } = req.params

    const existingAddress = await prisma.customerLocation.findFirst({
        where: {
            id: addressId,
            customerId,
            isDeleted: false,
        },
    })

    if (!existingAddress) {
        throw new CustomError(404, 'Address not found')
    }

    await prisma.customerLocation.updateMany({
        where: {
            customerId,
            isDefault: true,
            isDeleted: false,
        },
        data: { isDefault: false },
    })

    const updatedAddress = await prisma.customerLocation.update({
        where: { id: addressId },
        data: { isDefault: true },
        include: {
            country: {
                select: { id: true, name: true, code: true },
            },
            location: {
                select: { id: true, name: true, code: true },
            },
            area: {
                select: { id: true, name: true },
            },
        },
    })

    const cacheKey = `${envConfig.cache.KEY_PREFIX}-customer-addresses-${customerId}`
    await removeCache([cacheKey])

    const profileCacheKey = `${envConfig.cache.KEY_PREFIX}-customer-profile-${customerId}`
    await removeCache([profileCacheKey])

    return apiResponse.success(
        res,
        'Default address updated successfully',
        new CustomerAddressResource(updatedAddress).exec()
    )
}
