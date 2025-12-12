import Joi from 'joi'
import { Enums } from '../utils/prismaEnums.js'

export const foodItemSchema = {
    save: {
        body: Joi.object({
            // Optional ID for updates
            id: Joi.string().trim().allow(null, '').optional(),

            // Required fields
            name: Joi.string().trim().min(1).max(255).required(),

            code: Joi.string().trim().min(1).max(50).required(),

            mealTypeId: Joi.string().trim().required(),

            categoryId: Joi.string().trim().required(),

            cuisine: Joi.string().trim().required(),

            style: Joi.string().trim().required(),

            price: Joi.number().allow(null, ''),

            // Delivery configuration
            deliveryMode: Joi.string()
                .valid('SEPARATE', 'WITH_OTHER')
                .default('SEPARATE'),

            deliverWithId: Joi.alternatives().conditional('deliveryMode', {
                is: 'WITH_OTHER',
                then: Joi.string().trim().required().messages({
                    'any.required':
                        'You must select a food item to deliver with when "With Other" is chosen.',
                    'string.empty':
                        'Deliver With is required when "With Other" is selected.',
                }),
                otherwise: Joi.string().trim().allow(null, ''),
            }),

            // Optional fields
            description: Joi.string()
                .trim()
                .allow(null, '')
                .max(1000)
                .optional(),

            imageUrl: Joi.string().uri().allow(null, '').optional(),

            // Boolean flags (convert string "true"/"false" to boolean)
            isActive: Joi.boolean().default(true),

            isVegetarian: Joi.alternatives()
                .try(Joi.boolean(), Joi.string().valid('true', 'false'))
                .default(false)
                .custom((value) => value === true || value === 'true'),

            isVegan: Joi.alternatives()
                .try(Joi.boolean(), Joi.string().valid('true', 'false'))
                .default(false)
                .custom((value) => value === true || value === 'true'),

            // Arrays (handle both single value and arrays from form data)
            availableDays: Joi.alternatives()
                .try(
                    Joi.array()
                        .items(
                            Joi.string().valid(
                                ...Object.values(Enums.DayOfWeek)
                            )
                        )
                        .min(1),
                    Joi.string().valid(...Object.values(Enums.DayOfWeek))
                )
                .required(),

            planIds: Joi.array()
                .items(Joi.string())
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one plan must be selected.',
                }),

            areaIds: Joi.alternatives()
                .try(
                    Joi.array().items(Joi.string().trim()).min(1).messages({
                        'array.base': 'Areas must be an array of strings',
                        'array.min': 'At least one area is required',
                    }),
                    Joi.string().trim()
                )
                .optional(),
        }),
    },
}
