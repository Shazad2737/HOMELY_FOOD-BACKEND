'use strict'

const bannerStatusBadge = {
    true: 'success',
    false: 'danger',
}

let dt

const initDatatable = function () {
    dt = $('#kt_banners_table').DataTable({
        searchDelay: 500,
        processing: true,
        serverSide: true,
        order: [[0, 'asc']], // Default sort by placement
        stateSave: false,
        lengthMenu: [25, 50, 75, 100],
        pageLength: 25,
        ajax: {
            url: `/admin/banner/json`,
            type: 'GET',
            data: function (d) {
                d.placement = $('#placement_filter').val()
                d.status = $('#status_filter').val()
            },
            error: function (xhr, error, thrown) {
                console.error('DataTable AJAX error:', error, thrown)
                toastr.error('Error loading banners')
            },
        },
        columns: [
            { data: 'placement', name: 'placement', orderable: true },
            { data: 'title', name: 'title', orderable: true },
            { data: null, name: 'images', orderable: false },
            { data: 'isActive', name: 'status', orderable: true },
            { data: null, name: 'actions', orderable: false },
        ],
        columnDefs: [
            {
                targets: 0,
                render: function (data, type, row) {
                    const formatted = data
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return `<div class="d-flex flex-column">
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/banner/edit/${row.id}">
                                    ${formatted}
                                </a>
                                </div>`
                },
            },
            {
                targets: 1,
                render: function (data) {
                    return data
                        ? `<span class="text-gray-800">${data}</span>`
                        : '<span class="text-muted">-</span>'
                },
            },
            {
                targets: 2,
                render: function (data, type, row) {
                    const imageCount = row.images?.length || 0
                    const firstImage = row.images?.[0]?.imageUrl

                    if (firstImage) {
                        return `
                            <div class="d-flex align-items-center">
                                <div class="symbol symbol-50px me-2">
                                    <img src="${firstImage}" alt="Banner" class="rounded"/>
                                </div>
                                <span class="badge badge-light-primary">${imageCount} image${
                            imageCount !== 1 ? 's' : ''
                        }</span>
                            </div>`
                    }
                    return `<span class="badge badge-light-secondary">${imageCount} image${
                        imageCount !== 1 ? 's' : ''
                    }</span>`
                },
            },
            {
                targets: 3,
                render: function (data) {
                    const badgeClass = bannerStatusBadge[data] || 'secondary'
                    const statusText = data ? 'Active' : 'Inactive'
                    return `<div class="badge badge-light-${badgeClass} fw-semibold">${statusText}</div>`
                },
            },
            {
                targets: 4,
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary" 
                           data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                          Actions 
                          <i class="ki-outline ki-down fs-5 ms-1"></i>
                        </a>
                        <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-200px py-4" data-kt-menu="true">
                          <div class="menu-item px-3">
                            <a href="/admin/banner/edit/${
                                row.id
                            }" class="menu-link px-3">
                              <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit Banner
                            </a>
                          </div>
                          <div class="menu-item px-3">
                            <a href="#" 
                                class="menu-link px-3 change-status-btn"
                                data-id="${row.id}">
                                <i class="ki-outline ki-toggle-${
                                    row.isActive ? 'off' : 'on'
                                } fs-6 me-2"></i>
                                ${row.isActive ? 'Deactivate' : 'Activate'}
                            </a>
                          </div>
                          <div class="separator my-2"></div>
                          <div class="menu-item px-3">
                                <a href="#" 
                                    class="menu-link px-3 text-danger delete-item-btn"
                                    data-id="${row.id}">
                                    <i class="ki-outline ki-trash fs-6 me-2"></i>Delete
                                </a>
                          </div>
                        </div>`
                },
            },
        ],
        language: {
            processing:
                '<div class="spinner-border text-primary" role="status"></div>',
            emptyTable: 'No banners found',
            zeroRecords: 'No matching banners found',
        },
    })

    // Reinitialize menus after draw
    dt.on('draw', function () {
        if (window.KTMenu) {
            KTMenu.createInstances()
        }
    })
}

// Load placement options
const loadPlacementOptions = function () {
    // All available banner placements from schema
    const placements = [
        'HOME_PAGE_TOP',
        'HOME_PAGE_MIDDLE_1',
        'HOME_PAGE_MIDDLE_2',
        'HOME_PAGE_BOTTOM',
        'SUBSCRIPTION_PAGE',
        'LOCATION_FORM',
    ]

    const $select = $('#placement_filter')
    placements.forEach((placement) => {
        const label = placement
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase())
        $select.append(new Option(label, placement, false, false))
    })
}

// Initialize on DOM ready
KTUtil.onDOMContentLoaded(function () {
    loadPlacementOptions()
    initDatatable()

    // Placement filter
    $('#placement_filter').on('change', function () {
        dt.ajax.reload()
    })

    // Status filter
    $('#status_filter').on('change', function () {
        dt.ajax.reload()
    })

    // Clear filters
    $('#clear_filters_btn').on('click', function () {
        $('#placement_filter').val('').trigger('change')
        $('#status_filter').val('').trigger('change')
        dt.ajax.reload()
    })

    // Toggle Status
    $(document).on('click', '.change-status-btn', function (e) {
        e.preventDefault()
        const id = $(this).data('id')

        Swal.fire({
            text: "Are you sure you want to change this banner's status?",
            icon: 'warning',
            showCancelButton: true,
            buttonsStyling: false,
            confirmButtonText: 'Yes, change it!',
            cancelButtonText: 'No, cancel',
            customClass: {
                confirmButton: 'btn fw-bold btn-primary',
                cancelButton: 'btn fw-bold btn-active-light-primary',
            },
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: `/admin/banner/toggle-status/${id}`,
                    type: 'POST',
                    success: function (response) {
                        if (response.success) {
                            toastr.success(response.message)
                            dt.ajax.reload(null, false)
                        } else {
                            toastr.error(response.message)
                        }
                    },
                    error: function () {
                        toastr.error('Failed to toggle banner status')
                    },
                })
            }
        })
    })

    // Delete Banner
    $(document).on('click', '.delete-item-btn', function (e) {
        e.preventDefault()
        const id = $(this).data('id')

        Swal.fire({
            text: 'Are you sure you want to delete this banner? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            buttonsStyling: false,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel',
            customClass: {
                confirmButton: 'btn fw-bold btn-danger',
                cancelButton: 'btn fw-bold btn-active-light-primary',
            },
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: `/admin/banner/delete/${id}`,
                    type: 'DELETE',
                    success: function (response) {
                        if (response.success) {
                            toastr.success(response.message)
                            dt.ajax.reload(null, false)
                        } else {
                            toastr.error(response.message)
                        }
                    },
                    error: function () {
                        toastr.error('Failed to delete banner')
                    },
                })
            }
        })
    })
})
