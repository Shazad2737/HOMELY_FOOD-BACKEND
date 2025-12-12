function initDatePicker() {
    document.querySelectorAll('.kt_daterangepicker input').forEach((picker) => {
        const options = {
            altFormat: 'd F, Y',
            enableTime: picker.getAttribute('data-hastime') || false,
        }
        options.dateFormat =
            picker.getAttribute('data-hastime') == true ? 'Y-m-d H:i' : 'Y-m-d'
        if (picker.getAttribute('data-daterange') == true) {
            options.mode = picker.getAttribute('data-daterange')
                ? 'range'
                : 'single'
        }
        picker.flatpickr(options)
    })
}

function initRichTextEditor() {
    document.querySelectorAll('.page_builder_content').forEach((editor) => {
        ArticleEditor(editor, { css: '/admin/article-editor/css/' })
    })
}

initDatePicker()

// Function to clone div
var childIndex = 0
function cloneChild(event) {
    childIndex++
    let targetElement = event.target
    let parentId = targetElement.getAttribute('target-id')
    let parentLang = targetElement.getAttribute('target-lang')
    let langPrefix = targetElement.getAttribute('target-lang-prefix')

    let divToClone = document.querySelector(
        `.form-repeater-group-${parentLang}-${langPrefix}`
    )
    let newDiv = divToClone.cloneNode(true)
    newDiv.classList.remove('d-none')
    let newElement = document.getElementById(`${parentId}`).appendChild(newDiv)

    //setting ID for newly created card
    newElement.setAttribute(
        'id',
        `form_repeater_child_${parentLang}-${childIndex * 10000}`
    )

    // Remove values of inputs from newly created div
    document
        .querySelectorAll(
            `#form_repeater_child_${parentLang}-${
                childIndex * 10000
            } .beave-cms-form-field`
        )
        .forEach(function (element) {
            element.value = null
            element.removeAttribute('disabled')
        })

    // Setup media component of newly created div
    if (
        document
            .querySelector(`#${newElement.getAttribute('id')}`)
            .querySelector('.media-uploader-modal-btn')
    ) {
        document
            .querySelector(`#${newElement.getAttribute('id')}`)
            .querySelectorAll('.media-uploader-field')
            .forEach((mediaField) => {
                newMediaButtonId = `beave-media-field-${Math.floor(
                    Math.random() * 1000000000
                )}`
                mediaField
                    .querySelector('.media-uploader-modal-btn')
                    .setAttribute('id', newMediaButtonId)
                mediaField.querySelector(
                    '.media_preview .preview-holder'
                ).innerHTML = ''
                mediaField
                    .querySelector('.media_preview .image-preview-remove-btn')
                    .classList.add('d-none')
            })
    }

    document
        .querySelector(`#${newElement.getAttribute('id')}`)
        .querySelectorAll('input, textarea')
        .forEach((input) => {
            input.value = ''
        })
    document
        .querySelector(`#${newElement.getAttribute('id')}`)
        .querySelectorAll('.invalid-feedback')
        .forEach((errorField) => {
            errorField.classList.remove('d-inline')
            errorField.classList.add('d-none')
            errorField.innerHTML = ''
        })

    initDatePicker()
    initRichTextEditor()
}

// Function to delete div
function deleteChild(event) {
    let targetElement = event.target
    let parentDiv = targetElement.parentElement.parentElement.parentElement
    let childDiv = targetElement.parentElement.parentElement
    let parentId = parentDiv.getAttribute('id')
    let childId = childDiv.getAttribute('id')
    if (Number(childId?.split('-')?.[1]) > 0) {
        const parentElement = document.getElementById(parentId)
        const childElement = document.getElementById(childId)
        parentElement.removeChild(childElement)
    }
}

// This code only for creating slug from content title
function slugify(str) {
    return str
        ?.toLowerCase() // Convert the string to lowercase
        .replace(/\s+/g, '-') // Replace spaces with "-"
        .replace(/[^\w\-]+/g, '') // Remove non-word characters except "-"
        .replace(/\-\-+/g, '-') // Replace consecutive "-" with a single "-"
        .replace(/^-+/, '') // Trim "-" from the start of the string
        .replace(/-+$/, '') // Trim "-" from the end of the string
}

let slugField = document.getElementById('content_slug_field')
let contentTitleField = document.getElementById('content_title_field')

contentTitleField?.addEventListener('change', function (e) {
    if (e.target.value) {
        slugField.value = `${slugify(e.target.value)}`
    } else {
        slugField.value = ''
    }
})
