'use strict'

const foodItemStatusBadge = {
    true: 'success',
    false: 'danger',
}

let dt

function initDatatable() {
    dt = $('#fooditem_table').DataTable({
        searchDelay: 500,
        processing: true,
        serverSide: true,
        order: [[0, 'asc']],
        stateSave: false,
        lengthMenu: [25, 50, 75, 100],
        pageLength: 50,
        ajax: {
            url: '/admin/fooditem/json',
            type: 'GET',
            data: function (d) {
                // ✅ Always attach filter values here
                d.status = $('#fooditem_status_filter').val() || ''
                d.mealTypeId = $('#fooditem_mealtype_filter').val() || ''
                d.searchValue =
                    $('[data-kt-fooditem-filter="search"]').val() || ''
            },
            error: function (xhr, error, thrown) {
                console.error('DataTable AJAX error:', error, thrown)
                toastr.error('Error loading food items')
            },
        },
        columns: [
            { data: 'name' },
            { data: 'code' },
            { data: 'mealType.name' },
            { data: null },
            { data: 'isActive' },
            { data: null },
        ],
        columnDefs: [
            {
                targets: 0,
                render: function (data, type, row) {
                    const image = row.imageUrl || ''
                    const desc = row.description
                        ? `<span class="text-muted fs-7">${row.description.substring(
                              0,
                              80
                          )}${row.description.length > 80 ? '...' : ''}</span>`
                        : ''
                    return `
            <div class="d-flex align-items-center">
              <div class="symbol symbol-50px me-3">
                <img src="${image}" alt="${row.name}" class="rounded"/>
              </div>
              <div class="d-flex flex-column">
                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/fooditem/edit/${
                    row.id
                }">
                  ${row.name || ''}
                </a>
                ${desc}
              </div>
            </div>`
                },
            },
            {
                targets: 1,
                render: (data) =>
                    `<span class="badge badge-light-primary fw-bold">${
                        data || '-'
                    }</span>`,
            },
            {
                targets: 2,
                render: (data, type, row) =>
                    `<span class="badge badge-light-info">${
                        row.mealType?.name || 'N/A'
                    }</span>`,
            },
            {
                targets: 3,
                render: function (data, type, row) {
                    const badges = []
                    if (row.isVegetarian)
                        badges.push(
                            '<span class="badge badge-light-success me-1">Veg</span>'
                        )
                    if (row.isVegan)
                        badges.push(
                            '<span class="badge badge-light-info">Vegan</span>'
                        )
                    return badges.length
                        ? badges.join('')
                        : '<span class="text-muted">-</span>'
                },
            },
            {
                targets: 4,
                render: function (data) {
                    const badgeClass = foodItemStatusBadge[data] || 'secondary'
                    const statusText = data ? 'Active' : 'Inactive'
                    return `<div class="badge badge-light-${badgeClass} fw-semibold">${statusText}</div>`
                },
            },
            {
                targets: 5,
                className: 'text-center',
                render: function (data, type, row) {
                    const availableDays =
                        row.availableDays
                            ?.map((d) => d.dayOfWeek.substring(0, 3))
                            .join(', ') || 'All'
                    const planTypes =
                        row.planAvailability
                            ?.map((p) => p.planType)
                            .join(', ') || 'All'
                    const orderCount = row._count?.orderItems || 0

                    return `
            <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
               data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
              Actions <i class="ki-outline ki-down fs-5 ms-1"></i>
            </a>
            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary
                        fw-semibold fs-7 w-250px py-4" data-kt-menu="true">
              
              <div class="menu-item px-3">
                <a href="/admin/fooditem/edit/${row.id}" class="menu-link px-3">
                  <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit Item
                </a>
              </div>

              <div class="menu-item px-3">
                <a href="#" class="menu-link px-3 change-status-btn" data-id="${
                    row.id
                }">
                  <i class="ki-outline ki-toggle-${
                      row.isActive ? 'off' : 'on'
                  } fs-6 me-2"></i>
                  ${row.isActive ? 'Deactivate' : 'Activate'}
                </a>
              </div>

              <div class="separator my-2"></div>

              <div class="menu-item px-3">
                <div class="menu-content px-3 py-2">
                  <div class="mb-2">
                    <span class="text-muted fs-8 fw-bold d-block">Available Days:</span>
                    <span class="text-gray-800 fs-7">${availableDays}</span>
                  </div>
                  <div class="mb-2">
                    <span class="text-muted fs-8 fw-bold d-block">Plan Types:</span>
                    <span class="text-gray-800 fs-7">${planTypes}</span>
                  </div>
                  ${
                      orderCount
                          ? `<div><span class="text-muted fs-8 fw-bold d-block">Orders:</span>
                         <span class="badge badge-light-warning">${orderCount} orders</span></div>`
                          : ''
                  }
                </div>
              </div>

              <div class="separator my-2"></div>

              <div class="menu-item px-3">
                <a href="#" class="menu-link px-3 text-danger delete-item-btn" data-id="${
                    row.id
                }">
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
            emptyTable: 'No food items found',
            zeroRecords: 'No matching food items found',
        },
    })

    dt.on('draw', function () {
        if (window.KTMenu) KTMenu.createInstances()
    })
}

// Initialize Filters
function initFilters() {
    // Search filter
    $('[data-kt-fooditem-filter="search"]').on('keyup', function () {
        dt.ajax.reload()
    })

    // Status filter
    $('#fooditem_status_filter').on('change', function () {
        dt.ajax.reload()
    })

    // Meal type filter
    $('#fooditem_mealtype_filter').on('change', function () {
        dt.ajax.reload()
    })

    // Clear MealType Filter
    $('#clear_mealtype_filter').on('click', function () {
        $('#fooditem_mealtype_filter').val('').trigger('change') // reset select2
        dt.ajax.reload()
    })
}

// Load Meal Types (Dropdown)
async function loadMealTypes() {
    try {
        const response = await fetch('/admin/mealtype/all')
        const result = await response.json()
        if (result.success && result.data) {
            const select = $('#fooditem_mealtype_filter')
            select.html('<option value="">All Meal Types</option>')
            result.data.forEach((mt) => {
                select.append(new Option(mt.name, mt.id))
            })
            select.select2({ width: '100%' })
        }
    } catch (err) {
        console.error('Error loading meal types:', err)
    }
}

//  Event Handlers
$(document).on('click', '.change-status-btn', async function (e) {
    e.preventDefault()
    const id = $(this).data('id')

    const result = await Swal.fire({
        text: "Are you sure you want to change this food item's status?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, change it!',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn fw-bold btn-primary',
            cancelButton: 'btn fw-bold btn-active-light-primary',
        },
    })
    if (!result.isConfirmed) return

    try {
        const res = await fetch(`/admin/fooditem/toggle-status/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        if (data.success) {
            toastr.success(data.message)
            dt.ajax.reload(null, false)
        } else {
            toastr.error(data.message || 'Failed to update status')
        }
    } catch (err) {
        toastr.error('Error updating status')
    }
})

$(document).on('click', '.delete-item-btn', async function (e) {
    e.preventDefault()
    const id = $(this).data('id')

    const result = await Swal.fire({
        text: 'Are you sure you want to delete this food item?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn fw-bold btn-danger',
            cancelButton: 'btn fw-bold btn-active-light-primary',
        },
    })
    if (!result.isConfirmed) return

    try {
        const res = await fetch(`/admin/fooditem/delete/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        if (data.success) {
            toastr.success(data.message)
            dt.ajax.reload(null, false)
        } else {
            toastr.error(data.message || 'Failed to delete item')
        }
    } catch (err) {
        toastr.error('Error deleting item')
    }
})

// DOM Ready
KTUtil.onDOMContentLoaded(function () {
    initDatatable()
    initFilters()
    loadMealTypes()
})
