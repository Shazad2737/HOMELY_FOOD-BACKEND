import Joi from 'joi'

export const customerSchema = {
    // Create address
    createAddress: {
        body: Joi.object({
            type: Joi.string().valid('HOME', 'WORK', 'OTHER').default('HOME'),
            name: Joi.string().max(100).trim().allow(null, '').optional(),
            roomNumber: Joi.string().max(50).trim().allow(null, '').optional(),
            buildingName: Joi.string()
                .max(200)
                .trim()
                .allow(null, '')
                .optional(),
            zipCode: Joi.string().max(20).trim().allow(null, '').optional(),
            mobile: Joi.string()
                .pattern(/^[0-9]{8,15}$/)
                .allow(null, '')
                .optional(),
            latitude: Joi.string()
                .pattern(/^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/)
                .allow(null, '')
                .optional(),
            longitude: Joi.string()
                .pattern(/^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]{1,10})?$/)
                .allow(null, '')
                .optional(),
            isDefault: Joi.boolean().default(false),
            countryId: Joi.string().allow(null, '').optional(),
            locationId: Joi.string().required(),
            areaId: Joi.string().allow(null, '').optional(),
        }),
    },

    // Update address
    updateAddress: {
        params: Joi.object({
            addressId: Joi.string().required(),
        }),
        body: Joi.object({
            type: Joi.string().valid('HOME', 'WORK', 'OTHER').optional(),
            name: Joi.string().max(100).trim().allow(null, '').optional(),
            roomNumber: Joi.string().max(50).trim().allow(null, '').optional(),
            buildingName: Joi.string()
                .max(200)
                .trim()
                .allow(null, '')
                .optional(),
            zipCode: Joi.string().max(20).trim().allow(null, '').optional(),
            mobile: Joi.string()
                .pattern(/^[0-9]{8,15}$/)
                .allow(null, '')
                .optional(),
            latitude: Joi.string()
                .pattern(/^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/)
                .allow(null, '')
                .optional(),
            longitude: Joi.string()
                .pattern(/^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]{1,10})?$/)
                .allow(null, '')
                .optional(),
            isDefault: Joi.boolean().optional(),
            countryId: Joi.string().allow(null, '').optional(),
            locationId: Joi.string().optional(),
            areaId: Joi.string().allow(null, '').optional(),
        }).min(1), // At least one field must be provided
    },

    // Delete address
    deleteAddress: {
        params: Joi.object({
            addressId: Joi.string().required(),
        }),
    },

    // Set default address
    setDefaultAddress: {
        params: Joi.object({
            addressId: Joi.string().required(),
        }),
    },
}
