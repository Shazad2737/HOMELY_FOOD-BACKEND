import Joi from 'joi'

export const mealTypeSchema = {
    save: {
        body: Joi.object({
            mealTypes: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.string().trim().required(),
                        type: Joi.string()
                            .valid('BREAKFAST', 'LUNCH', 'DINNER')
                            .required(),
                        name: Joi.string().trim().required(),
                        description: Joi.string().trim().allow(null, ''),
                        startTime: Joi.string()
                            .trim()
                            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                            .required()
                            .messages({
                                'string.pattern.base':
                                    'Start time must be in HH:MM format',
                            }),
                        endTime: Joi.string()
                            .trim()
                            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                            .required()
                            .messages({
                                'string.pattern.base':
                                    'End time must be in HH:MM format',
                            }),
                        isActive: Joi.string()
                            .valid('true', 'false')
                            .default('false'),
                        sortOrder: Joi.number().integer().min(0).required(),
                    })
                )
                .min(1)
                .required(),
        }),
    },
}

export const brandSettingsSchema = {
    save: {
        body: Joi.object({
            id: Joi.string().trim().allow(null, ''),
            advanceOrderCutoffHour: Joi.number()
                .integer()
                .min(0)
                .max(23)
                .required()
                .messages({
                    'number.base': 'Cutoff hour must be a number',
                    'number.min': 'Cutoff hour must be between 0 and 23',
                    'number.max': 'Cutoff hour must be between 0 and 23',
                    'any.required': 'Cutoff hour is required',
                }),
            minAdvanceOrderDays: Joi.number()
                .integer()
                .min(0)
                .max(30)
                .required()
                .messages({
                    'number.base': 'Minimum advance days must be a number',
                    'number.min': 'Minimum advance days must be at least 0',
                    'number.max': 'Minimum advance days cannot exceed 30',
                    'any.required': 'Minimum advance days is required',
                }),
            maxAdvanceOrderDays: Joi.number()
                .integer()
                .min(1)
                .max(90)
                .required()
                .custom((value, helpers) => {
                    const minDays =
                        helpers.state.ancestors[0].minAdvanceOrderDays
                    if (value < minDays) {
                        return helpers.error('any.invalid')
                    }
                    return value
                })
                .messages({
                    'number.base': 'Maximum advance days must be a number',
                    'number.min': 'Maximum advance days must be at least 1',
                    'number.max': 'Maximum advance days cannot exceed 90',
                    'any.required': 'Maximum advance days is required',
                    'any.invalid':
                        'Maximum advance days must be greater than or equal to minimum advance days',
                }),
            whatsappNumber: Joi.string()
                .trim()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .allow(null, '')
                .messages({
                    'string.pattern.base':
                        'WhatsApp number must be a valid phone number with country code',
                }),
            phoneNumber: Joi.string()
                .trim()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .allow(null, '')
                .messages({
                    'string.pattern.base':
                        'Phone number must be a valid phone number with country code',
                }),
            helpCenterUrl: Joi.string()
                .trim()
                .uri({ scheme: ['http', 'https'] })
                .allow(null, '')
                .messages({
                    'string.uri': 'Help Center URL must be a valid URL',
                }),
            termsAndConditions: Joi.string()
                .allow(null, '')
                .optional()
                .max(50000),
            privacyPolicy: Joi.string()
                .allow(null, '')
                .optional()
                .max(50000),
            isActive: Joi.string().valid('true', 'false').default('false'),
        }),
    },
}
