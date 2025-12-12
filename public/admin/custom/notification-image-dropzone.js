document.addEventListener('DOMContentLoaded', function () {
    const existingImageUrl =
        document.querySelector('#notificationImageUrl')?.value || ''

    if (typeof Dropzone === 'undefined') {
        console.error('Dropzone not loaded.')
        return
    }

    initSingleImageDropzone(
        '#notificationImageDropzone',
        '/admin/notification/image-upload', // backend upload route
        '#notificationImageUrl',
        existingImageUrl
    )
})
