import Joi from 'joi'

export const categorySchema = {
    save: {
        body: Joi.object({
            id: Joi.string().trim().allow(null, '').optional(),
            name: Joi.string().trim().required().messages({
                'string.base': 'Name must be a string',
                'string.empty': 'Name is required',
                'any.required': 'Name is a required field',
            }),
            description: Joi.string().allow(null, ''),
            sortOrder: Joi.number().integer().default(0),
            imageUrl: Joi.string().uri().required().messages({
                'string.base': 'Image URL must be a string',
                'string.uri': 'Image URL must be a valid URI',
                'any.required': 'Image URL is required',
                'string.empty': 'Image URL cannot be empty',
            }),
            areas: Joi.alternatives()
                .try(
                    Joi.array().items(Joi.string().trim()).min(1).messages({
                        'array.base': 'Areas must be an array of strings',
                        'array.min': 'At least one area is required',
                    }),
                    Joi.string().trim().allow('', null).messages({
                        'string.base': 'Area must be a string',
                    })
                )
                .optional()
                .messages({
                    'alternatives.match':
                        'Areas must be either a string or an array of strings',
                }),
        }),
    },
}
