document.addEventListener('DOMContentLoaded', function () {
    const existingImageUrl =
        document.querySelector('#planImageUrl')?.value || ''

    if (typeof Dropzone === 'undefined') {
        console.error('Dropzone not loaded.')
        return
    }

    // Initialize single image dropzone for Plan image
    initSingleImageDropzone(
        '#planImageDropzone',
        '/admin/plan/image-upload',
        '#planImageUrl',
        existingImageUrl
    )
})
