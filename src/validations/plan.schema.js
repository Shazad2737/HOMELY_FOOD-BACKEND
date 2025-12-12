import Joi from 'joi'
import { Enums } from '../utils/prismaEnums.js'

export const planSchema = {
    save: {
        body: Joi.object({
            id: Joi.string().trim().allow(null, '').optional(),

            name: Joi.string().trim().required().messages({
                'string.base': 'Plan name must be a text value.',
                'string.empty': 'Plan name is required.',
                'any.required': 'Please enter the plan name.',
            }),

            type: Joi.string()
                .valid(...Object.values(Enums.PlanType))
                .required()
                .messages({
                    'any.only':
                        'Plan type must be one of BASIC, PREMIUM, or ULTIMATE.',
                    'any.required': 'Please select a plan type.',
                }),

            categoryId: Joi.string().trim().required().messages({
                'string.empty': 'Category is required.',
                'any.required': 'Please select a category.',
            }),

            description: Joi.string().allow(null, '').messages({
                'string.base': 'Description must be a text value.',
            }),

            imageUrl: Joi.string().uri().required().messages({
                'string.empty': 'Plan image is required.',
                'string.uri': 'Image URL must be a valid link.',
                'any.required': 'Please upload a plan image.',
            }),

            isActive: Joi.alternatives()
                .try(Joi.boolean(), Joi.string().valid('true', 'false'))
                .default(false)
                .messages({
                    'boolean.base': 'isActive must be a boolean value.',
                }),

            isUnlimited: Joi.alternatives()
                .try(Joi.boolean(), Joi.string().valid('true', 'false'))
                .default(false)
                .messages({
                    'boolean.base': 'isUnlimited must be a boolean value.',
                }),

            sortOrder: Joi.number().integer().default(0).messages({
                'number.base': 'Sort order must be a number.',
                'number.integer': 'Sort order must be an integer value.',
            }),
        }),
    },
}
