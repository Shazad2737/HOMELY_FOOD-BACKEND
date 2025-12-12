try {
    ;('use strict')

    let locationStatusBadge = {
        true: 'success',
        false: 'danger',
    }

    var KTDatatablesServerSide = (function () {
        var table, dt

        var initDatatable = function () {
            dt = $('#location_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[0, 'asc']],
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: {
                    url: `/admin/location/json`,
                    data: function (d) {
                        d.status = $('#location_status_filter').val()
                    },
                },
                columns: [
                    {
                        data: 'name',
                        className: 'min-w-150px',
                        defaultContent: '<i>Location Name</i>',
                    },
                    {
                        data: 'code',
                        className: 'min-w-100px',
                        defaultContent: '<i>Code</i>',
                    },
                    { data: 'latitude', className: 'min-w-100px' },
                    { data: 'isActive', className: 'min-w-70px' },
                    { data: null, className: 'min-w-100px' },
                    { data: null, className: 'text-center min-w-100px' },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: (data, type, row) => `
                            <div class="d-flex flex-column">
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/location/edit/${
                                    row.id
                                }">
                                    ${row.name || ''}
                                </a>
                            </div>
                        `,
                    },
                    {
                        targets: 1,
                        render: (data) =>
                            `<div class="badge badge-light-info fw-bold">${
                                data || '-'
                            }</div>`,
                    },
                    {
                        targets: 2,
                        render: (data, type, row) => {
                            if (row.latitude && row.longitude) {
                                return `
                                    <div class="d-flex flex-column">
                                        <span class="text-gray-700 fs-7">Lat: ${row.latitude}</span>
                                        <span class="text-gray-700 fs-7">Lng: ${row.longitude}</span>
                                    </div>`
                            }
                            return `<span class="text-muted">-</span>`
                        },
                    },
                    {
                        targets: 3,
                        render: (data) => {
                            let badgeClass =
                                locationStatusBadge[data] || 'secondary'
                            let statusText = data ? 'Active' : 'Inactive'
                            return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-end p-2">
                                        <span class="fw-semibold fs-7">${statusText}</span>
                                    </div>`
                        },
                    },
                    {
                        targets: 4,
                        render: (data, type, row) => {
                            const stats = []
                            if (row._count?.areas > 0) {
                                stats.push(
                                    `<span class="badge badge-light-primary me-1">${row._count.areas} Areas</span>`
                                )
                            }
                            if (row._count?.CustomerLocation > 0) {
                                stats.push(
                                    `<span class="badge badge-light-info me-1">${row._count.CustomerLocation} Customers</span>`
                                )
                            }
                            if (row._count?.brands > 0) {
                                stats.push(
                                    `<span class="badge badge-light-success">${row._count.brands} Brands</span>`
                                )
                            }
                            return stats.length > 0
                                ? `<div class="d-flex flex-wrap gap-1">${stats.join(
                                      ''
                                  )}</div>`
                                : `<span class="text-muted">No data</span>`
                        },
                    },
                    {
                        targets: 5,
                        render: (data, type, row) => `
                            <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
                                data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                Actions <i class="ki-outline ki-down fs-5 ms-1"></i>
                            </a>
                            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 
                                menu-state-bg-light-primary fw-semibold fs-7 w-150px py-4" data-kt-menu="true">
                                <div class="menu-item px-3">
                                    <a href="/admin/location/edit/${
                                        row.id
                                    }" class="menu-link px-3">
                                        <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                                    </a>
                                </div>
                                <div class="menu-item px-3">
                                    <a href="#" class="menu-link px-3 toggle-status-btn" data-id="${
                                        row.id
                                    }">
                                        <i class="ki-outline ki-toggle-${
                                            row.isActive ? 'off' : 'on'
                                        } fs-6 me-2"></i>
                                        ${
                                            row.isActive
                                                ? 'Deactivate'
                                                : 'Activate'
                                        }
                                    </a>
                                </div>
                                <div class="menu-item px-3">
                                    <a href="#" class="menu-link px-3 text-danger delete-location-btn" data-id="${
                                        row.id
                                    }">
                                        <i class="ki-outline ki-trash fs-6 me-2"></i>Delete
                                    </a>
                                </div>
                            </div>
                        `,
                    },
                ],
            })

            // filters
            $('#location_status_filter').on('change', () => dt.ajax.reload())

            dt.on('draw', () => window.KTMenu && KTMenu.createInstances())
        }

        return {
            init: initDatatable,
        }
    })()

    KTUtil.onDOMContentLoaded(() => KTDatatablesServerSide.init())

    // SweetAlert2-powered actions
    $('#location_table').on('click', '.toggle-status-btn', (e) => {
        e.preventDefault()
        const id = $(e.currentTarget).data('id')
        handleAction({
            url: `/admin/location/toggle-status/${id}`,
            confirmTitle: 'Change Status?',
            confirmText:
                "Are you sure you want to change this location's status?",
            successMessage: 'Location status updated successfully!',
        })
    })

    $('#location_table').on('click', '.delete-location-btn', (e) => {
        e.preventDefault()
        const id = $(e.currentTarget).data('id')
        handleAction({
            url: `/admin/location/delete/${id}`,
            method: 'DELETE',
            confirmTitle: 'Delete Location?',
            confirmText: 'This action cannot be undone. Delete this location?',
            successMessage: 'Location deleted successfully!',
        })
    })
} catch (error) {
    console.error('ERR', error)
}

// Reusable action handler with SweetAlert2
async function handleAction({
    url,
    method = 'POST',
    confirmTitle,
    confirmText,
    successMessage,
    errorMessage,
    reloadTable = '#location_table',
}) {
    const result = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Continue',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary',
        },
        buttonsStyling: false,
    })

    if (!result.isConfirmed) return

    try {
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            showConfirmButton: false,
        })

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()

        Swal.close()

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: successMessage || data.message,
                timer: 2000,
                showConfirmButton: false,
            })
            if (reloadTable) $(reloadTable).DataTable().ajax.reload()
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed!',
                text: errorMessage || data.message || 'Something went wrong.',
            })
        }
    } catch (err) {
        Swal.close()
        console.error(err)
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred.',
        })
    }
}
