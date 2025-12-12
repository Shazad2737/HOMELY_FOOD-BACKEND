import Joi from 'joi'

export const locationSchema = {
    save: {
        body: Joi.object({
            id: Joi.string().trim().allow(null, ''),
            name: Joi.string().trim().required().messages({
                'string.empty': 'Location name is required',
                'any.required': 'Location name is required',
            }),
            code: Joi.string()
                .trim()
                .uppercase()
                .min(2)
                .max(10)
                .pattern(/^[A-Z0-9]+$/)
                .required()
                .messages({
                    'string.empty': 'Location code is required',
                    'any.required': 'Location code is required',
                    'string.min': 'Location code must be at least 2 characters',
                    'string.max': 'Location code must not exceed 10 characters',
                    'string.pattern.base':
                        'Location code must contain only uppercase letters and numbers',
                }),
            countryId: Joi.string().trim().required().messages({
                'string.empty': 'Country is required',
                'any.required': 'Country is required',
            }),
            latitude: Joi.string()
                .trim()
                .allow(null, '')
                .pattern(/^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]+)?$/)
                .messages({
                    'string.pattern.base':
                        'Invalid latitude format (e.g., 24.4539)',
                }),
            longitude: Joi.string()
                .trim()
                .allow(null, '')
                .pattern(/^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]+)?$/)
                .messages({
                    'string.pattern.base':
                        'Invalid longitude format (e.g., 54.3773)',
                }),
        }),
    },
}
