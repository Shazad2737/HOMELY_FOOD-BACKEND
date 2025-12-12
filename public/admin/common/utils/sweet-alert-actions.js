/**
 * Reusable SweetAlert2 action handler for CRUD operations
 * @param {Object} options - Configuration options
 * @param {string} options.url - API endpoint URL
 * @param {string} [options.method='POST'] - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {Object} [options.body] - Request body for POST/PUT/PATCH requests
 * @param {string} options.confirmTitle - Confirmation dialog title
 * @param {string} options.confirmText - Confirmation dialog text
 * @param {string} [options.confirmButtonText='Yes, Continue'] - Confirm button text
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button text
 * @param {string} [options.successMessage] - Success message (optional)
 * @param {string} [options.reloadTable] - DataTable selector to reload (optional)
 * @param {boolean} [options.useSessionStorage=true] - Store message in sessionStorage and reload page
 * @param {boolean} [options.closeModalOnSuccess=false] - Close Bootstrap modal after success
 * @param {string} [options.modalSelector] - Modal selector to close (e.g., '#myModal')
 * @param {Function} [options.onSuccess] - Custom success callback (optional)
 * @param {Function} [options.onError] - Custom error callback (optional)
 * @param {Function} [options.beforeRequest] - Callback before request (optional)
 * @returns {Promise<boolean>} - Returns true if action was successful
 */
async function handleAction({
    url,
    method = 'POST',
    body = null,
    confirmTitle,
    confirmText,
    confirmButtonText = 'Yes, Continue',
    cancelButtonText = 'Cancel',
    successMessage,
    reloadTable = null,
    useSessionStorage = true,
    closeModalOnSuccess = false,
    modalSelector = null,
    onSuccess = null,
    onError = null,
    beforeRequest = null,
}) {
    // Show confirmation dialog
    const result = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary',
        },
        buttonsStyling: false,
    })

    if (!result.isConfirmed) return false

    try {
        // Execute beforeRequest callback if provided
        if (beforeRequest && typeof beforeRequest === 'function') {
            const shouldContinue = await beforeRequest()
            if (shouldContinue === false) return false
        }

        // Show loading dialog
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we process your request.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            didOpen: () => Swal.showLoading(),
            showConfirmButton: false,
        })

        // Prepare fetch options
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        }

        // Add body for POST, PUT, PATCH requests
        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            fetchOptions.body = JSON.stringify(body)
        }

        // Make API request
        const response = await fetch(url, fetchOptions)

        // Handle non-JSON responses
        let data
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
            data = await response.json()
        } else {
            data = {
                success: response.ok,
                message: response.ok
                    ? 'Operation completed successfully'
                    : 'Request failed',
            }
        }

        Swal.close()

        // Handle success
        if (data.success || response.ok) {
            const finalSuccessMessage =
                successMessage ||
                data.message ||
                'Operation completed successfully'

            // Close modal if specified
            if (closeModalOnSuccess && modalSelector) {
                const modalElement = document.querySelector(modalSelector)
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement)
                    if (modal) {
                        modal.hide()
                    } else {
                        // If no instance exists, create one and hide
                        const newModal = new bootstrap.Modal(modalElement)
                        newModal.hide()
                    }
                }
            }

            if (useSessionStorage) {
                sessionStorage.setItem(
                    'toastrStatusMessage',
                    finalSuccessMessage
                )
                location.reload()
            } else {
                showSuccessToast(finalSuccessMessage)

                // Reload DataTable if specified
                if (reloadTable) {
                    const tableElement = $(reloadTable)
                    if (
                        tableElement.length &&
                        $.fn.DataTable.isDataTable(reloadTable)
                    ) {
                        tableElement.DataTable().ajax.reload(null, false)
                    }
                }

                // Execute custom success callback
                if (onSuccess && typeof onSuccess === 'function') {
                    await onSuccess(data)
                }
            }

            return true
        } else {
            // Handle failure
            showErrorAlert(
                data.message || 'Something went wrong. Please try again.'
            )

            if (onError && typeof onError === 'function') {
                await onError(data)
            }

            return false
        }
    } catch (err) {
        Swal.close()
        console.error('Action handler error:', err)

        showErrorAlert(
            err.message ||
                'An unexpected error occurred. Please check your connection and try again.'
        )

        if (onError && typeof onError === 'function') {
            await onError(err)
        }

        return false
    }
}

/**
 * Show a success toast notification using toastr
 * @param {string} message - The message to display
 */
function showSuccessToast(message) {
    if (typeof toastr !== 'undefined') {
        toastr.success(message)
    } else {
        console.log('Success:', message)
    }
}

/**
 * Show an error toast notification using toastr
 * @param {string} message - The message to display
 */
function showErrorToast(message) {
    if (typeof toastr !== 'undefined') {
        toastr.error(message)
    } else {
        console.error('Error:', message)
    }
}

/**
 * Show a warning toast notification using toastr
 * @param {string} message - The message to display
 */
function showWarningToast(message) {
    if (typeof toastr !== 'undefined') {
        toastr.warning(message)
    } else {
        console.warn('Warning:', message)
    }
}

/**
 * Show an info toast notification using toastr
 * @param {string} message - The message to display
 */
function showInfoToast(message) {
    if (typeof toastr !== 'undefined') {
        toastr.info(message)
    } else {
        console.info('Info:', message)
    }
}

/**
 * Show an error alert dialog (blocking)
 * @param {string} message - The message to display
 * @param {string} [title='Error!'] - Alert title
 * @param {string} [confirmButtonText='OK'] - Confirm button text
 */
function showErrorAlert(message, title = 'Error!', confirmButtonText = 'OK') {
    return Swal.fire({
        icon: 'error',
        title,
        text: message,
        confirmButtonText,
        confirmButtonColor: '#dc3545',
        customClass: {
            confirmButton: 'btn btn-danger',
        },
        buttonsStyling: false,
    })
}

/**
 * Show a success alert dialog (blocking)
 * @param {string} message - The message to display
 * @param {string} [title='Success!'] - Alert title
 * @param {string} [confirmButtonText='OK'] - Confirm button text
 */
function showSuccessAlert(
    message,
    title = 'Success!',
    confirmButtonText = 'OK'
) {
    return Swal.fire({
        icon: 'success',
        title,
        text: message,
        confirmButtonText,
        confirmButtonColor: '#28a745',
        customClass: {
            confirmButton: 'btn btn-success',
        },
        buttonsStyling: false,
    })
}

/**
 * Show a confirmation dialog
 * @param {string} message - The message to display
 * @param {string} [title='Are you sure?'] - Dialog title
 * @param {string} [confirmButtonText='Yes'] - Confirm button text
 * @param {string} [cancelButtonText='Cancel'] - Cancel button text
 * @returns {Promise<boolean>} - Returns true if confirmed, false otherwise
 */
async function showConfirmDialog(
    message,
    title = 'Are you sure?',
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel'
) {
    const result = await Swal.fire({
        title,
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary',
        },
        buttonsStyling: false,
    })
    return result.isConfirmed
}

/**
 * Configure toastr and check for session messages on DOM load
 */
document.addEventListener('DOMContentLoaded', function () {
    // Configure toastr with default options
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            closeButton: false,
            newestOnTop: false,
            progressBar: false,
            positionClass: 'toastr-bottom-right',
            preventDuplicates: false,
            onclick: null,
            showDuration: '300',
            hideDuration: '1000',
            timeOut: '8000',
            extendedTimeOut: '1000',
            showEasing: 'swing',
            hideEasing: 'linear',
            showMethod: 'fadeIn',
            hideMethod: 'fadeOut',
        }
    }

    // Check for session messages and display them
    const successMsg = sessionStorage.getItem('toastrStatusMessage')
    if (successMsg) {
        showSuccessToast(successMsg)
        sessionStorage.removeItem('toastrStatusMessage')
    }

    const errorMsg = sessionStorage.getItem('toastrErrorMessage')
    if (errorMsg) {
        showErrorToast(errorMsg)
        sessionStorage.removeItem('toastrErrorMessage')
    }
})
