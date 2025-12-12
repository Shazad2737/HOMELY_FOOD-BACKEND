# Sweet Alert Actions - Usage Guide

A unified notification system combining **Toastr** (for toast notifications) and **SweetAlert2** (for modal dialogs).

## 📦 What's Included

-   **Toast Notifications** - Non-blocking notifications using Toastr
-   **Modal Dialogs** - Blocking alerts and confirmations using SweetAlert2
-   **CRUD Action Handler** - Complete workflow for API operations with confirmation
-   **Session Message Support** - Automatic display of messages after page redirects

---

## 🍞 Toast Notifications (Toastr)

Simple, non-blocking notifications that appear at the bottom-right corner.

### Success Toast

```javascript
showSuccessToast('Data saved successfully!')
```

### Error Toast

```javascript
showErrorToast('Something went wrong!')
```

### Warning Toast

```javascript
showWarningToast('Please check your input')
```

### Info Toast

```javascript
showInfoToast('New update available')
```

**Features:**

-   Auto-close after 8 seconds
-   Positioned at bottom-right
-   Colored backgrounds (green/red/orange/blue)
-   Smooth fade in/out animations

---

## 🔔 Modal Dialogs (SweetAlert2)

Blocking dialogs that require user interaction.

### Error Alert

```javascript
showErrorAlert('Invalid email address')

// With custom title and button
showErrorAlert('Invalid email', 'Validation Error', 'Got it')
```

### Success Alert

```javascript
showSuccessAlert('Account created successfully!')

// With custom title and button
showSuccessAlert('Done!', 'Success', 'Continue')
```

### Confirmation Dialog

```javascript
const confirmed = await showConfirmDialog('Delete this item?')
if (confirmed) {
    // User clicked Yes
    console.log('Deleting...')
} else {
    // User clicked Cancel
    console.log('Cancelled')
}

// With custom options
const result = await showConfirmDialog(
    'Are you sure you want to proceed?',
    'Confirm Action',
    'Yes, proceed',
    'No, cancel'
)
```

---

## 🚀 CRUD Action Handler

Complete workflow for API operations with confirmation, loading, and result handling.

### Basic Usage

```javascript
await handleAction({
    url: '/admin/item/delete',
    confirmTitle: 'Delete Item',
    confirmText: 'Are you sure you want to delete this item?',
    successMessage: 'Item deleted successfully',
})
```

### Advanced Usage

```javascript
await handleAction({
    url: '/admin/user/update',
    method: 'PUT',
    body: { id: 123, status: 'active' },
    confirmTitle: 'Update Status',
    confirmText: 'Change user status to active?',
    confirmButtonText: 'Yes, Update',
    cancelButtonText: 'Cancel',
    successMessage: 'Status updated successfully',
    reloadTable: '#users-table',
    useSessionStorage: false,
    closeModalOnSuccess: true,
    modalSelector: '#editModal',
    beforeRequest: async () => {
        // Validate before sending request
        if (!validateForm()) {
            showErrorToast('Please fill all required fields')
            return false // Cancel the request
        }
        return true // Continue with request
    },
    onSuccess: async (data) => {
        console.log('Success:', data)
        // Custom success handling
    },
    onError: async (error) => {
        console.error('Error:', error)
        // Custom error handling
    },
})
```

### Parameters

| Parameter             | Type     | Default           | Description                                         |
| --------------------- | -------- | ----------------- | --------------------------------------------------- |
| `url`                 | string   | **required**      | API endpoint URL                                    |
| `method`              | string   | `'POST'`          | HTTP method (GET, POST, PUT, DELETE, PATCH)         |
| `body`                | object   | `null`            | Request body for POST/PUT/PATCH                     |
| `confirmTitle`        | string   | **required**      | Confirmation dialog title                           |
| `confirmText`         | string   | **required**      | Confirmation dialog text                            |
| `confirmButtonText`   | string   | `'Yes, Continue'` | Confirm button text                                 |
| `cancelButtonText`    | string   | `'Cancel'`        | Cancel button text                                  |
| `successMessage`      | string   | `null`            | Success message (uses API response if not provided) |
| `reloadTable`         | string   | `null`            | DataTable selector to reload (e.g., `'#myTable'`)   |
| `useSessionStorage`   | boolean  | `true`            | Store message and reload page                       |
| `closeModalOnSuccess` | boolean  | `false`           | Close Bootstrap modal after success                 |
| `modalSelector`       | string   | `null`            | Modal selector to close (e.g., `'#myModal'`)        |
| `onSuccess`           | function | `null`            | Custom success callback                             |
| `onError`             | function | `null`            | Custom error callback                               |
| `beforeRequest`       | function | `null`            | Callback before request (return false to cancel)    |

### Return Value

Returns `Promise<boolean>` - `true` if successful, `false` if failed or cancelled.

---

## 💾 Session Messages

Messages stored in sessionStorage are automatically displayed after page redirects.

### Store Message Before Redirect

```javascript
// Success message
sessionStorage.setItem('toastrStatusMessage', 'Data saved successfully')
location.reload()

// Error message
sessionStorage.setItem('toastrErrorMessage', 'Failed to save data')
location.reload()
```

The messages will be automatically displayed as toasts when the page loads and then removed from sessionStorage.

---

## 🎨 Toastr Configuration

Toastr is automatically configured with these settings:

```javascript
{
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
```

---

## 📝 Real-World Examples

### Example 1: Delete Item

```javascript
function deleteItem(id) {
    handleAction({
        url: `/admin/items/${id}/delete`,
        confirmTitle: 'Delete Item',
        confirmText: 'This action cannot be undone!',
        confirmButtonText: 'Yes, delete it',
        successMessage: 'Item deleted successfully',
    })
}
```

### Example 2: Update Status

```javascript
function changeStatus(id, status) {
    handleAction({
        url: '/admin/items/status',
        method: 'POST',
        body: { id, status },
        confirmTitle: 'Change Status',
        confirmText: `Change status to ${status}?`,
        useSessionStorage: true, // Will reload page after success
    })
}
```

### Example 3: Form Submission with Validation

```javascript
async function submitForm() {
    const formData = getFormData()

    const success = await handleAction({
        url: '/admin/items/create',
        method: 'POST',
        body: formData,
        confirmTitle: 'Create Item',
        confirmText: 'Create this new item?',
        useSessionStorage: false,
        beforeRequest: async () => {
            if (!validateForm(formData)) {
                showErrorToast('Please fill all required fields')
                return false
            }
            return true
        },
        onSuccess: async (data) => {
            $('#myModal').modal('hide')
            $('#items-table').DataTable().ajax.reload()
            showSuccessToast('Item created successfully!')
        },
    })

    return success
}
```

### Example 4: Simple Notifications

```javascript
// After saving data
showSuccessToast('Settings saved!')

// On validation error
showErrorToast('Email is required')

// Warning message
showWarningToast('Session will expire in 5 minutes')

// Info message
showInfoToast('New version available')
```

### Example 5: Confirmation Before Action

```javascript
async function exportData() {
    const confirmed = await showConfirmDialog(
        'Export all data to CSV?',
        'Export Data',
        'Yes, export',
        'Cancel'
    )

    if (confirmed) {
        // Proceed with export
        window.location.href = '/admin/export/csv'
    }
}
```

---

## 🔧 Integration with Forms

The notification system works seamlessly with the `es-form.js` form handler:

```html
<form
    class="es-form"
    action="/admin/items/save"
    data-redirect-url="/admin/items"
>
    <!-- form fields -->
    <button type="submit" class="form-submit-btn">
        <span class="label">Save</span>
        <span class="preloader d-none">Loading...</span>
    </button>
</form>
```

On success, the form automatically:

1. Stores success message in sessionStorage
2. Redirects to the specified URL
3. Displays the toast notification on the new page

---

## 🎯 Best Practices

1. **Use toasts for non-critical notifications** - Success messages, info updates
2. **Use modals for important actions** - Confirmations, errors that need attention
3. **Keep messages concise** - Short, clear messages work best
4. **Use session storage for redirects** - Ensures messages survive page reloads
5. **Provide meaningful feedback** - Tell users what happened and what to do next

---

## 🐛 Troubleshooting

### Toasts not showing?

-   Check browser console for errors
-   Ensure `toastr` is loaded (included in `plugins.bundle.js`)
-   Verify the script is loaded after `plugins.bundle.js`

### Modals not appearing?

-   Check browser console for errors
-   Ensure `Swal` (SweetAlert2) is loaded (included in `plugins.bundle.js`)
-   Verify no JavaScript errors are blocking execution

### Session messages not displaying?

-   Check sessionStorage in browser DevTools
-   Ensure the key is `toastrStatusMessage` or `toastrErrorMessage`
-   Verify the script runs on page load

---

## 📚 Dependencies

-   **Toastr** - Included in `plugins.bundle.js`
-   **SweetAlert2** - Included in `plugins.bundle.js`
-   **Bootstrap** (optional) - For modal closing functionality

---