import multer from 'multer'
import { CustomError } from '../utils/customError.js'

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

    if (!allowedTypes.has(file.mimetype)) {
        return cb(
            new CustomError(
                400,
                'Invalid file type. Only JPEG, PNG and WEBP are allowed.'
            ),
            false
        )
    }

    cb(null, true)
}

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter,
})
