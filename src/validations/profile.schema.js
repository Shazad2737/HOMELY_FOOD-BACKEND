import Joi from 'joi'

export const profileSchema = {
    // Profile update validation
    update: {
        body: Joi.object({
            id: Joi.string().trim().required(),
            name: Joi.string().trim().min(2).max(100).required().messages({
                'string.empty': 'Name is required',
                'string.min': 'Name must be at least 2 characters long',
                'string.max': 'Name must not exceed 100 characters',
            }),
            email: Joi.string().trim().email().lowercase().required().messages({
                'string.empty': 'Email is required',
                'string.email': 'Please provide a valid email address',
            }),
        }),
    },
}

export const passwordSchema = {
    // Change password validation
    change: {
        body: Joi.object({
            currentPassword: Joi.string().required().messages({
                'string.empty': 'Current password is required',
            }),
            newPassword: Joi.string()
                .min(8)
                .max(128)
                .pattern(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
                )
                .required()
                .messages({
                    'string.empty': 'New password is required',
                    'string.min': 'Password must be at least 8 characters long',
                    'string.max': 'Password must not exceed 128 characters',
                    'string.pattern.base':
                        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
                }),
            confirmPassword: Joi.string()
                .valid(Joi.ref('newPassword'))
                .required()
                .messages({
                    'string.empty': 'Please confirm your new password',
                    'any.only': 'Passwords do not match',
                }),
        }),
    },
}
