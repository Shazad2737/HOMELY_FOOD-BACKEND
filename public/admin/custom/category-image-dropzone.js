document.addEventListener('DOMContentLoaded', function () {
    const existingImageUrl =
        document.querySelector('#categoryImageUrl')?.value || ''
    if (typeof Dropzone === 'undefined') {
        console.error('Dropzone not loaded.')
        return
    }

    // Reuse your existing dropzone helper
    initSingleImageDropzone(
        '#categoryImageDropzone',
        '/admin/category/image-upload', // backend upload route
        '#categoryImageUrl',
        existingImageUrl
    )
})
