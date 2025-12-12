export const validate = (schema, options = {}) => {
    const defaultOptions = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
        ...options,
    }

    return (req, res, next) => {
        const validationPromises = []
        const validationResults = {}

        ;['body', 'params', 'query', 'headers'].forEach((key) => {
            if (schema[key]) {
                validationPromises.push(
                    schema[key]
                        .validateAsync(req[key], defaultOptions)
                        .then((value) => {
                            validationResults[key] = value
                        })
                        .catch((err) => {
                            throw { key, error: err }
                        })
                )
            }
        })

        Promise.all(validationPromises)
            .then(() => {
                Object.keys(validationResults).forEach((key) => {
                    req[key] = validationResults[key]
                })
                next()
            })
            .catch(({ key, error }) => {
                // If the URL starts with /admin, use raw Joi error format
                if (req.originalUrl?.startsWith('/admin')) {
                    return res.status(422).json(error)
                }

                // Otherwise, use the formatted response
                const errors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    type: detail.type,
                }))

                return res.status(400).json({
                    success: false,
                    message: `Validation error in ${key}`,
                    errors,
                })
            })
    }
}

// Async wrapper to catch validation errors in async route handlers
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
