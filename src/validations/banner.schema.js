import Joi from 'joi'
import { Enums } from '../utils/prismaEnums.js'

export const bannerSchema = {
    save: {
        body: Joi.object({
            id: Joi.string().optional().allow('', null),

            placement: Joi.string()
                .valid(...Object.values(Enums.BannerPlacement))
                .required()
                .messages({
                    'string.empty': 'Placement is required',
                    'any.required': 'Placement is required',
                    'any.only': 'Invalid placement selected',
                }),

            title: Joi.string().optional().allow('', null),
            description: Joi.string().optional().allow('', null),
            sortOrder: Joi.number().integer().min(0).default(0),
            isActive: Joi.boolean().default(false),

            images: Joi.array()
                .items(
                    Joi.object({
                        imageUrl: Joi.string().uri().required().messages({
                            'string.uri': 'Invalid image URL format',
                            'any.required': 'Image URL is required',
                        }),
                        redirectUrl: Joi.string()
                            .uri()
                            .optional()
                            .allow('', null),
                        caption: Joi.string().optional().allow('', null),
                        sortOrder: Joi.number().integer().min(0).default(0),
                        isActive: Joi.boolean().default(false),
                    })
                )
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one banner image is required',
                    'any.required': 'Banner images are required',
                }),

            deletedImages: Joi.alternatives()
                .try(
                    Joi.array().items(Joi.string().uri()),
                    Joi.string() // handles case when form sends JSON stringified array
                )
                .optional()
                .default([])
                .custom((value, helpers) => {
                    // parse if stringified JSON
                    if (typeof value === 'string') {
                        try {
                            const parsed = JSON.parse(value)
                            if (!Array.isArray(parsed)) {
                                return helpers.error('any.invalid')
                            }
                            return parsed
                        } catch {
                            return helpers.error('any.invalid')
                        }
                    }
                    return value
                })
                .messages({
                    'any.invalid': 'Invalid deleted images format',
                }),
        }),
    },
}
