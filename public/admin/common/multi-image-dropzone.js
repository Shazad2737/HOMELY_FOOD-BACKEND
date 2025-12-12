Dropzone.autoDiscover = false

/**
 * Initialize multi-image dropzone for banners
 * @param {string} dropzoneId - The ID of the dropzone element
 * @param {string} uploadUrl - The URL for file uploads
 * @param {Array} existingImages - Array of existing images (for edit page)
 * @param {Array} uploadedImagesRef - Reference array to store uploaded images
 * @param {string} csrfToken - CSRF token for secure uploads
 */
function initMultiImageDropzone(
    dropzoneId,
    uploadUrl,
    existingImages = [],
    uploadedImagesRef = [],
    csrfToken = null
) {
    // Clear and populate the reference array
    uploadedImagesRef.length = 0
    uploadedImagesRef.push(
        ...existingImages.map((img) => ({
            url: img.url,
            redirectUrl: img.redirectUrl || '',
            caption: img.caption || '',
            sortOrder: img.sortOrder || 0,
            isActive: img.isActive !== false,
        }))
    )

    const token =
        csrfToken || document.querySelector('meta[name="csrf-token"]')?.content

    const myDropzone = new Dropzone(dropzoneId, {
        url: uploadUrl,
        paramName: 'file',
        maxFilesize: 5,
        maxFiles: 10,
        acceptedFiles: 'image/*',
        addRemoveLinks: true,
        thumbnailWidth: 120,
        thumbnailHeight: 120,
        dictDefaultMessage: 'Drop files here or click to upload.',
        dictFallbackMessage:
            "Your browser does not support drag'n'drop file uploads.",
        dictFileTooBig:
            'File is too big ({{filesize}}MB). Max filesize: {{maxFilesize}}MB.',
        dictInvalidFileType: "You can't upload files of this type.",
        dictResponseError: 'Server responded with {{statusCode}} code.',
        dictCancelUpload: 'Cancel upload',
        dictCancelUploadConfirmation:
            'Are you sure you want to cancel this upload?',
        dictRemoveFile: 'Remove file',
        dictMaxFilesExceeded: 'You can only upload up to 10 files.',
        headers: {
            'X-CSRF-TOKEN': token,
        },
        init: function () {
            const dropzone = this

            // Load existing images
            if (existingImages.length > 0) {
                loadExistingImages(dropzone, existingImages)
            }

            this.on('success', function (file, response) {
                handleSuccess(file, response, uploadedImagesRef)
            })

            this.on('removedfile', function (file) {
                handleRemove(file, uploadedImagesRef)
            })

            this.on('error', function (file, message, xhr) {
                console.error('Dropzone error:', message)
            })
        },
    })

    /**
     * Load existing images into dropzone
     */
    function loadExistingImages(dropzone, existingImages) {
        existingImages.forEach((img, index) => {
            const fileName = img.url.split('/').pop()
            const mockFile = {
                name: fileName,
                size: 12345,
                accepted: true,
                status: Dropzone.SUCCESS,
                upload: {
                    uuid: Dropzone.uuidv4(),
                    progress: 100,
                    total: 12345,
                    bytesSent: 12345,
                    filename: fileName,
                },
            }

            dropzone.emit('addedfile', mockFile)
            dropzone.emit('thumbnail', mockFile, img.url)
            dropzone.emit('complete', mockFile)
            dropzone.files.push(mockFile)

            setTimeout(() => {
                const previewElements =
                    dropzone.element.querySelectorAll('.dz-preview')
                if (previewElements.length > index) {
                    const previewElement = previewElements[index]
                    previewElement.dataset.imageUrl = img.url
                    fixImageAspectRatio(previewElement)
                }
            }, 100)
        })
    }

    /**
     * Handle successful upload
     */
    function handleSuccess(file, response, uploadedImagesRef) {
        if (response.url) {
            const imageUrl = response.url
            file.previewElement.dataset.imageUrl = imageUrl

            fixImageAspectRatio(file.previewElement)

            uploadedImagesRef.push({
                url: imageUrl,
                redirectUrl: '',
                caption: '',
                sortOrder: uploadedImagesRef.length,
                isActive: true,
            })
        } else {
            console.error('Upload success but no URL in response:', response)
            this.removeFile(file)
        }
    }

    /**
     * Handle file removal
     */
    function handleRemove(file, uploadedImagesRef) {
        if (file.previewElement?.dataset.imageUrl) {
            const imageUrl = file.previewElement.dataset.imageUrl
            const index = uploadedImagesRef.findIndex(
                (img) => img.url === imageUrl
            )

            if (index !== -1) {
                uploadedImagesRef.splice(index, 1)
            }
        }
    }

    /**
     * Fix image aspect ratio in preview
     */
    function fixImageAspectRatio(previewElement) {
        const imgElement = previewElement.querySelector('.dz-image img')
        if (imgElement) {
            imgElement.style.width = 'auto'
            imgElement.style.height = 'auto'
            imgElement.style.maxWidth = '100%'
            imgElement.style.maxHeight = '100%'
            imgElement.style.position = 'absolute'
            imgElement.style.top = '50%'
            imgElement.style.left = '50%'
            imgElement.style.transform = 'translate(-50%, -50%)'
            imgElement.style.objectFit = 'contain'
        }
    }

    /**
     * Add custom styling
     */
    function addStyling() {
        if (!document.getElementById('dropzone-multi-custom-styles')) {
            const style = document.createElement('style')
            style.id = 'dropzone-multi-custom-styles'
            style.textContent = `
                .dz-preview {
                    position: relative;
                }
                
                .dz-image {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 120px;
                    height: 120px;
                    overflow: hidden;
                    position: relative;
                }
                
                .dz-image img {
                    object-fit: cover;
                }
                
                .dropzone .dz-preview .dz-image {
                    width: 120px;
                    height: 120px;
                    border-radius: 8px;
                    overflow: hidden;
                }
            `
            document.head.appendChild(style)
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addStyling)
    } else {
        addStyling()
    }

    return myDropzone
}
