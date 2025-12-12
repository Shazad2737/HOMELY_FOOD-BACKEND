import ImageKit from 'imagekit'
import { envConfig } from '../config/env.js'
import { logger } from '../src/utils/logger.js'

// Initialize ImageKit instance
const getImageKitInstance = () => {
    return new ImageKit({
        publicKey: envConfig.imagekit.PUBLIC_KEY,
        privateKey: envConfig.imagekit.PRIVATE_KEY,
        urlEndpoint: envConfig.imagekit.URL,
    })
}

export const imageKitMediaUpload = async (media, folder, file) => {
    const imagekit = getImageKitInstance()

    let baseFolder =
        `${envConfig.imagekit?.FOLDER?.toLowerCase()}/${envConfig.general?.NODE_ENV?.toLowerCase()}` ||
        `${envConfig.general?.CLIENT_NAME?.toLowerCase()}/${envConfig.general?.NODE_ENV?.toLowerCase()}`

    const uploaded = await imagekit
        .upload({
            folder: `${baseFolder}/${folder}`,
            file: media,
            fileName: file?.originalname?.toLowerCase() || 'sample-image',
        })
        .then(async (result) => {
            return result
        })
        .catch((error) => {
            logger.error('ERR', error)
            return false
        })

    return uploaded
}

export const getFileDetailsByUrl = async (url) => {
    try {
        const imagekit = getImageKitInstance()

        const urlEndpoint = envConfig.imagekit.URL
        const filePath = url.replace(urlEndpoint, '').split('?')[0]

        // Search for the file
        const files = await imagekit.listFiles({
            searchQuery: `name="${filePath.split('/').pop()}"`,
            limit: 10,
        })

        // Find exact match
        const file = files.find((f) => f.filePath === filePath)
        return file || null
    } catch (error) {
        logger.error(`Error getting file details: ${error.message}`)
        return null
    }
}

export const imageKitMediaDelete = async (fileId) => {
    try {
        if (!fileId) {
            logger.warn('No fileId provided for deletion')
            return false
        }

        const imagekit = getImageKitInstance()

        await imagekit.deleteFile(fileId)
        logger.info(`Successfully deleted file with ID: ${fileId}`)
        return true
    } catch (error) {
        logger.error(`Error deleting file from ImageKit: ${error.message}`)
        return false
    }
}

export const imageKitMediaDeleteByUrl = async (url) => {
    try {
        if (!url) {
            logger.warn('No URL provided for deletion')
            return false
        }

        const fileDetails = await getFileDetailsByUrl(url)

        if (!fileDetails || !fileDetails.fileId) {
            logger.warn(`Could not find file details for URL: ${url}`)
            return false
        }

        return await imageKitMediaDelete(fileDetails.fileId)
    } catch (error) {
        logger.error(`Error deleting file by URL: ${error.message}`)
        return false
    }
}
