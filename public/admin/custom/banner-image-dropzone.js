document.addEventListener('DOMContentLoaded', function () {
    if (typeof Dropzone === 'undefined') {
        console.error('Dropzone not loaded.')
        return
    }

    // Get existing images for edit mode
    const existingImagesData = document.querySelector(
        '#existingBannerImages'
    )?.value
    let existingImages = []

    if (existingImagesData) {
        try {
            existingImages = JSON.parse(existingImagesData)
        } catch (e) {
            console.error('Failed to parse existing images:', e)
        }
    }

    // Array to store uploaded images
    const uploadedImages = []

    //Array to Deleted images
    const deletedImages = []

    // Initialize multi-image dropzone
    const myDropzone = initMultiImageDropzone(
        '#kt_banner_images_dropzone',
        '/admin/banner/image-upload',
        existingImages,
        uploadedImages
    )

    // Show/hide image details section
    function toggleImageDetailsSection() {
        const section = document.getElementById('imageDetailsSection')
        if (section) {
            section.style.display = uploadedImages.length > 0 ? 'block' : 'none'
        }
    }

    // Render image detail forms
    function renderImageDetails() {
        const container = document.getElementById('imageDetailsContainer')
        if (!container) return

        container.innerHTML = ''

        uploadedImages.forEach((img, index) => {
            const detailHtml = `
                <div class="card mb-4" data-image-index="${index}">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-4">
                            <img src="${img.url}" alt="Image ${
                index + 1
            }" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                            <div class="ms-4 flex-grow-1">
                                <h5 class="mb-0">Image ${index + 1}</h5>
                            </div>
                        </div>

                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Redirect URL</label>
                                <input type="text" class="form-control" name="images[${index}][redirectUrl]" 
                                       value="${
                                           img.redirectUrl || ''
                                       }" placeholder="https://example.com">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Caption</label>
                                <input type="text" class="form-control" name="images[${index}][caption]" 
                                       value="${
                                           img.caption || ''
                                       }" placeholder="Image caption">
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <label class="form-label">Sort Order</label>
                                <input type="number" class="form-control" name="images[${index}][sortOrder]" 
                                       value="${
                                           img.sortOrder !== undefined
                                               ? img.sortOrder
                                               : index
                                       }" min="0">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Status</label>
                                <div class="form-check form-switch form-check-custom form-check-solid mt-2">
                                    <input class="form-check-input" type="checkbox" name="images[${index}][isActive]" 
                                           value="true" ${
                                               img.isActive !== false
                                                   ? 'checked'
                                                   : ''
                                           }>
                                    <label class="form-check-label">Active</label>
                                </div>
                            </div>
                        </div>

                        <input type="hidden" name="images[${index}][imageUrl]" value="${
                img.url
            }">
                    </div>
                </div>
            `
            container.insertAdjacentHTML('beforeend', detailHtml)
        })

        toggleImageDetailsSection()
    }

    // Watch for dropzone changes
    myDropzone.on('success', function (file, response) {
        setTimeout(renderImageDetails, 100)
    })

    myDropzone.on('removedfile', function (file) {
        const imageUrl = file.previewElement?.dataset.imageUrl
        if (imageUrl && !deletedImages.includes(imageUrl)) {
            deletedImages.push(imageUrl)
        }
        setTimeout(renderImageDetails, 100)
    })

    // Initial render for edit mode
    if (existingImages.length > 0) {
        setTimeout(renderImageDetails, 500)
    }

    // Form validation - ensure at least one image
    const form = document.getElementById('kt_banner_form')
    if (form) {
        form.addEventListener('submit', function (e) {
            // Clear previous errors
            document.querySelectorAll('.invalid-feedback').forEach((el) => {
                el.textContent = ''
                el.style.display = 'none'
            })
            document
                .querySelectorAll('.is-invalid')
                .forEach((el) => el.classList.remove('is-invalid'))

            // Validate images
            if (uploadedImages.length === 0) {
                e.preventDefault()
                const errorDiv = document.getElementById('field-error-images')
                if (errorDiv) {
                    errorDiv.textContent =
                        'At least one banner image is required'
                    errorDiv.style.display = 'block'
                }
                if (typeof showToast !== 'undefined') {
                    showToast(
                        'error',
                        'Please upload at least one banner image'
                    )
                }
                return false
            }

            // Update hidden fields with latest values from detail forms
            uploadedImages.forEach((img, index) => {
                const redirectUrl =
                    document.querySelector(
                        `input[name="images[${index}][redirectUrl]"]`
                    )?.value || ''
                const caption =
                    document.querySelector(
                        `input[name="images[${index}][caption]"]`
                    )?.value || ''
                const sortOrder =
                    document.querySelector(
                        `input[name="images[${index}][sortOrder]"]`
                    )?.value || index
                const isActive =
                    document.querySelector(
                        `input[name="images[${index}][isActive]"]`
                    )?.checked || false

                img.redirectUrl = redirectUrl
                img.caption = caption
                img.sortOrder = parseInt(sortOrder)
                img.isActive = isActive
            })

            // Clean up stale hidden input if re-submitting
            const existingField = document.querySelector(
                'input[name="deletedImages"]'
            )
            if (existingField) existingField.remove()

            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = 'deletedImages'
            input.value = JSON.stringify(deletedImages)
            form.appendChild(input)
        })
    }
})
