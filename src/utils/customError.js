export class CustomError extends Error {
    constructor(
        statusCode = 500,
        message = 'Internal Server Error',
        errors = null,
        code = null
    ) {
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.code = code
        Error.captureStackTrace(this, this.constructor)
    }
}
