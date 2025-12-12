/*
    BEGIN::Media Management
*/
const mediaManagementPanel = document.querySelector('#media-management-panel')
if (mediaManagementPanel) {
    const dropZoneDiv = document.querySelector(
        '#media_upload_management_dropzone'
    )
    const hasPdfUpload = dropZoneDiv.getAttribute('data-upload-pdf') || false
    // Setting the acceptedFiles for the dropzone
    let acceptedFiles = `image/*,video/mp4`
    // if hasPdfUpload is true then .pdf extension will be added to the acceptedFiles
    if (hasPdfUpload == 'true') {
        acceptedFiles += `,.pdf`
    }
    var myDropzone = new Dropzone('#media_upload_management_dropzone', {
        url: '/admin/contents/media/upload', // Set the url for your upload script location
        paramName: 'file', // The name that will be used to transfer the file
        maxFiles: 10,
        maxFilesize: 10, // MB
        addRemoveLinks: true,
        acceptedFiles,
        uploadMultiple: true, // Upload all files in a single request
        parallelUploads: 10,
        accept: function (file, done) {
            done()
        },
        successmultiple: function (file, response) {
            axios
                .get('/admin/contents/media/json')
                .then(function (response) {
                    console.log('response', response)
                    let mp4IconSrc = '/admin/media/mp4-icon.png'
                    // Handle the successful response
                    var mediaList = `<div class="row">`
                    // console.log(response.data)
                    response.data.forEach((element) => {
                        mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2 p-2 media-list-item" data-name="${
                            element?.file?.name
                        }">
                            <img class="lozad img-thumbnail cursor-pointer" data-fileType="${
                                element.file_type
                            }" data-mediaUrl="${element.url}" src="${
                            element.file_type?.startsWith('video')
                                ? mp4IconSrc
                                : element.url
                        }?tr=w-150,h-150" data-mediaTitle="${
                            element.meta?.title || ''
                        }" data-altText="${element.meta?.alt_text || ''}" />
                            </div>`
                    })
                    mediaList = `${mediaList}</div>`
                    // e.target.querySelector('#field_id').value =
                    //     e.relatedTarget.getAttribute('id')
                    // console.log(e.relatedTarget.getAttribute('id'))
                    document.getElementById('modal-media-holder').innerHTML =
                        mediaList
                    // location.reload()
                    toastr.success('Image uploaded successfully')
                })
                .catch(function (error) {
                    // Handle the error
                    console.error(error)
                    toastr.error(error.error || 'something went wrong')
                })
        },
        error: function (error) {
            console.log('error :>> ', error)
            toastr.error(error.error || 'something went wrong')
        },
    })

    let buttons = document.querySelectorAll('.copy-btn')
    var clipboard = new ClipboardJS(buttons)
    clipboard.on('success', function (e) {
        navigator.clipboard.writeText(e.text)
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            },
        })
        Toast.fire({ icon: 'success', title: 'URL Copied to clipboard' })
        e.clearSelection()
    })

    // Media searching in media listing page
    $('#search-image-input').on('keyup', function (e) {
        var value = e.target?.value?.toLowerCase()
        if (value) {
            document
                .querySelectorAll('#page-media-holder .media-list-item')
                .forEach(function (item) {
                    let divName = item.getAttribute('data-name')
                    // if search value is not included in the div name then add d-none to the classlist of div
                    if (!divName.includes(value)) {
                        item.classList.add('d-none')
                    } else {
                        item.classList.remove('d-none')
                    }
                })
        } else {
            document
                .querySelectorAll('#page-media-holder .media-list-item')
                .forEach(function (item) {
                    item.classList.remove('d-none')
                })
        }
    })
}

// Media searching in media attach modal
$('#search-image-input-modal').on('keyup', function (e) {
    var value = e.target?.value?.toLowerCase()
    if (value) {
        document
            .querySelectorAll('#modal-media-holder .media-list-item')
            .forEach(function (item) {
                let divName = item.getAttribute('data-name')
                // console.log("item: " + divName)
                // if search value is not included in the div name then add d-none to the classlist of div
                if (!divName.includes(value)) {
                    item.classList.add('d-none')
                } else {
                    item.classList.remove('d-none')
                }
            })
    } else {
        document
            .querySelectorAll('#modal-media-holder .media-list-item')
            .forEach(function (item) {
                item.classList.remove('d-none')
            })
    }
})

var mediaModal = document.getElementById('modal_for_media_list')
mediaModal.addEventListener('show.bs.modal', function (e) {
    document.getElementById('modal-media-holder').innerHTML = 'Loading...'
    document.querySelector('#media-modal-selected-media-url').value = ''
    document.querySelector('#media-modal-selected-media-title').value = ''
    document.querySelector('#media-modal-selected-media-alt').value = ''
    document.querySelector('#media-modal-selected-preview-img').innerHTML = ''
    axios
        .get('/admin/contents/media/json')
        .then(function (response) {
            // Handle the successful response
            var mediaList = `<div class="row">`
            // console.log(response.data)
            response.data.forEach((element) => {
                let mp4IconSrc = '/admin/media/mp4-icon.png'
                mediaList = `${mediaList} <div class="col-12 col-sm-3 col-md-2 p-2 media-list-item" data-name="${
                    element?.file?.name
                }">
                    <img class="lozad img-thumbnail" data-fileType="${
                        element.file_type
                    }" data-mediaUrl="${element.url}" src="${
                    element.file_type?.startsWith('video')
                        ? mp4IconSrc
                        : element.url
                }?tr=w-150,h-150" data-mediaTitle="${
                    element.meta?.title || ''
                }" data-altText="${element.meta?.alt_text || ''}" />
                </div>`
            })
            mediaList = `${mediaList}</div>`
            e.target.querySelector('#field_id').value =
                e.relatedTarget.getAttribute('id')
            // console.log(e.relatedTarget.getAttribute('id'))
            document.getElementById('modal-media-holder').innerHTML = mediaList
        })
        .catch(function (error) {
            // Handle the error
            console.error(error)
        })
})

document
    .querySelector('#modal-media-holder')
    .addEventListener('click', function (event) {
        var mediaUrl = event.target.getAttribute('data-mediaUrl')
        var mediaTitle = event.target.getAttribute('data-mediaTitle')
        var altText = event.target.getAttribute('data-altText')
        var fileType = event.target.getAttribute('data-fileType')
        // console.log(attachButtonId)
        if (mediaUrl) {
            let mp4IconSrc = '/admin/media/mp4-icon.png'
            document.querySelector(
                '#media-modal-selected-preview-img'
            ).innerHTML = `<img class="img-thumbnail" src="${
                fileType?.startsWith('video') ? mp4IconSrc : mediaUrl
            }" data-fileType=${fileType}/>`

            document.querySelector('#media-modal-selected-media-url').value =
                mediaUrl
            document.querySelector('#media-modal-selected-media-title').value =
                mediaTitle
            document.querySelector('#media-modal-selected-media-alt').value =
                altText
            document.querySelector('#media-modal-selected-media-type').value =
                fileType?.startsWith('video') ? 'video' : 'image'

            // Do something when a list item is clicked, such as displaying its text content
            // console.log(attachButtonId)
        }
    })

document
    .querySelector('#media-attach-submit-btn')
    .addEventListener('click', function (event) {
        event.preventDefault()
        // alert('kooi')
        var attachButtonId = mediaModal.querySelector('#field_id').value
        var selectedMediaUrl = document.querySelector(
            '#media-modal-selected-media-url'
        ).value
        var selectedMediaTitle = document.querySelector(
            '#media-modal-selected-media-title'
        ).value
        var selectedMediaAltText = document.querySelector(
            '#media-modal-selected-media-alt'
        ).value
        var selectedMediaTypeText = document.querySelector(
            '#media-modal-selected-media-type'
        ).value
        if (selectedMediaUrl) {
            $(mediaModal).modal('hide')
            let mp4IconSrc = '/admin/media/mp4-icon.png'
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.mediaUrlField').value =
                selectedMediaUrl
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.mediaTitleField').value =
                selectedMediaTitle
            document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector('.mediaAltTextField').value =
                selectedMediaAltText
            if (
                document
                    .querySelector(`#${attachButtonId}`)
                    .parentElement?.querySelector('.media_file_type_field')
            ) {
                document
                    .querySelector(`#${attachButtonId}`)
                    .parentElement.querySelector(
                        '.media_file_type_field'
                    ).value = selectedMediaTypeText
            }

            const imgHolderParent = document
                .querySelector(`#${attachButtonId}`)
                .parentElement.querySelector(`.media_preview`)
            // console.log(imgHolderParent)
            imgHolderParent.querySelector(
                `.preview-holder`
            ).innerHTML = `<img width="150px" class="img-thumbnail" src="${
                selectedMediaTypeText == 'video' ? mp4IconSrc : selectedMediaUrl
            }?tr=w-150" />`
            imgHolderParent
                .querySelector(`.image-preview-remove-btn`)
                .classList.remove('d-none')
        }
    })

//
document.addEventListener('click', function (e) {
    if (e.target.matches('.image-preview-remove-btn')) {
        // console.log("Clicked on an element with class 'class-name'")
        e.preventDefault()
        // console.log(e.target)
        e.target.classList.add('d-none')
        e.target.parentElement.parentElement
            .querySelectorAll('input[type="hidden"]')
            .forEach((element) => {
                element.value = ''
            })
        e.target.previousElementSibling.innerHTML = ' '
    }
})
/*
    END::Media Management
*/

// ROUTE: /admin/contents/menu
const menuItemAddModal = document.querySelector('#kt_modal_create_item')
if (menuItemAddModal) {
    menuItemAddModal.addEventListener('show.bs.modal', function (e) {
        const sectionId = e.relatedTarget.getAttribute('data-sectionId')
        document.querySelector('#nav-id').value = sectionId
    })
}

document.querySelectorAll('.media-list-item').forEach((eachMediaItem) => {
    eachMediaItem.addEventListener('click', function (e) {
        const targetId = e.target.parentNode.getAttribute('data-id')
        document.querySelectorAll('.active').forEach(function (e) {
            e.classList.remove('active')
        })
        e.target.parentNode.classList.add('active')

        let pdfThumbnailURL = `/admin/assets/media/pdf-thumbnail.png`
        let mp4IconSrc = '/admin/media/mp4-icon.png'
        axios
            .get(`/admin/contents/media/view/${targetId}`)
            .then(function (response) {
                if (response?.data?.file_type == 'pdf') {
                    document.querySelector(
                        '#media-meta-panel #img-holder #preview-img'
                    ).src = pdfThumbnailURL || ''
                } else if (response?.data?.file_type == 'video/mp4') {
                    document.querySelector(
                        '#media-meta-panel #img-holder #preview-img'
                    ).src = mp4IconSrc
                } else {
                    document.querySelector(
                        '#media-meta-panel #img-holder #preview-img'
                    ).src = response.data.url || ''
                }
                document.querySelector(
                    '#media-meta-panel input[name="id"]'
                ).value = response.data._id || ''
                document.querySelector(
                    '#media-meta-panel input[name="title"]'
                ).value = response.data.meta?.title || ''
                document.querySelector(
                    '#media-meta-panel input[name="alt_text"]'
                ).value = response.data.meta?.alt_text || ''
            })
            .catch(function (err) {
                // Handle the error
                console.error(err)
            })
    })
})
