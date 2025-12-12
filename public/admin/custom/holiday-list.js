try {
    ;('use strict')

    let holidayTypeBadge = {
        SPECIFIC_DATE: 'info',
        RECURRING_WEEKLY: 'primary',
    }

    let dayOfWeekNames = {
        SUNDAY: 'Sunday',
        MONDAY: 'Monday',
        TUESDAY: 'Tuesday',
        WEDNESDAY: 'Wednesday',
        THURSDAY: 'Thursday',
        FRIDAY: 'Friday',
        SATURDAY: 'Saturday',
    }

    var KTDatatablesServerSide = (function () {
        var table
        var dt

        var initDatatable = function () {
            dt = $('#holiday_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[0, 'asc']],
                orderable: false,
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: {
                    url: `/admin/holiday/json`,
                    data: function (d) {
                        d.type = $('#holiday_type_filter').val()
                        d.status = $('#holiday_status_filter').val()
                    },
                },
                columns: [
                    {
                        data: 'name',
                        className: 'min-w-200px',
                    },
                    {
                        data: 'type',
                        className: 'min-w-150px',
                    },
                    {
                        data: 'date',
                        className: 'min-w-140px',
                    },
                    {
                        data: 'description',
                        className: 'min-w-200px',
                    },
                    {
                        data: 'isActive',
                        className: 'min-w-80px',
                    },
                    {
                        data: null,
                        className: 'text-center min-w-100px',
                    },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/holiday/edit/${row.id}">
                                    ${row.name}
                                </a>
                            </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            let badgeClass =
                                holidayTypeBadge[data] || 'secondary'
                            let typeText =
                                data === 'SPECIFIC_DATE'
                                    ? 'Specific Date'
                                    : 'Recurring Weekly'
                            return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-center p-2">
                                <span class="fw-semibold fs-7">${typeText}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            if (row.type === 'SPECIFIC_DATE' && row.date) {
                                const date = new Date(row.date)
                                const formattedDate = date.toLocaleDateString(
                                    'en-US',
                                    {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    }
                                )

                                // Check if date is in the past or future
                                const now = new Date()
                                const isPast = date < now
                                const isFuture = date > now

                                let dateInfo = ''
                                if (isPast) {
                                    dateInfo =
                                        '<div class="badge badge-light-secondary fs-8 mt-1">Past</div>'
                                } else if (isFuture) {
                                    const daysUntil = Math.ceil(
                                        (date - now) / (1000 * 60 * 60 * 24)
                                    )
                                    if (daysUntil <= 7) {
                                        dateInfo = `<div class="badge badge-light-warning fs-8 mt-1">In ${daysUntil} days</div>`
                                    } else if (daysUntil <= 30) {
                                        dateInfo = `<div class="badge badge-light-info fs-8 mt-1">In ${daysUntil} days</div>`
                                    }
                                }

                                return `<div class="d-flex flex-column">
                                    <span class="text-gray-800 fw-semibold">${formattedDate}</span>
                                    ${dateInfo}
                                </div>`
                            } else if (
                                row.type === 'RECURRING_WEEKLY' &&
                                row.dayOfWeek
                            ) {
                                return `<div class="d-flex align-items-center">
                                    <i class="ki-outline ki-calendar-2 fs-5 text-primary me-2"></i>
                                    <span class="text-gray-800 fw-semibold">${
                                        dayOfWeekNames[row.dayOfWeek] ||
                                        row.dayOfWeek
                                    }</span>
                                </div>`
                            }
                            return '<span class="text-muted">-</span>'
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            if (!data) {
                                return '<span class="text-muted">-</span>'
                            }
                            return `<span class="text-gray-600">${data}</span>`
                        },
                    },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            return data
                                ? '<span class="badge badge-light-success">Active</span>'
                                : '<span class="badge badge-light-danger">Inactive</span>'
                        },
                    },
                    {
                        targets: 5,
                        data: null,
                        className: 'text-center',
                        render: function (data, type, row) {
                            return `
                                <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary" 
                                    data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                    Actions 
                                    <i class="ki-outline ki-down fs-5 ms-1"></i>
                                </a>
                                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4" data-kt-menu="true">
                                    <div class="menu-item px-3">
                                        <a href="/admin/holiday/edit/${
                                            row.id
                                        }" class="menu-link px-3">
                                            <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                                        </a>
                                    </div>
                                    <div class="menu-item px-3">
                                        <a href="#" class="menu-link px-3 toggle-status" data-id="${
                                            row.id
                                        }" data-status="${row.isActive}">
                                            <i class="ki-outline ki-${
                                                row.isActive
                                                    ? 'cross-circle'
                                                    : 'check-circle'
                                            } fs-6 me-2"></i>${
                                row.isActive ? 'Deactivate' : 'Activate'
                            }
                                        </a>
                                    </div>
                                </div>
                            `
                        },
                    },
                ],
            })

            table = dt.$

            // Type filter
            let typeSelect = document.querySelector('#holiday_type_filter')
            if (typeSelect) {
                $(typeSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Status filter
            let statusSelect = document.querySelector('#holiday_status_filter')
            if (statusSelect) {
                $(statusSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Clear filters
            $('#clear_filters_btn').on('click', function () {
                $('#holiday_type_filter').val('').trigger('change')
                $('#holiday_status_filter').val('').trigger('change')
                dt.ajax.reload()
            })

            // Handle toggle status
            dt.on('draw', function (e) {
                if (window.KTMenu) KTMenu.createInstances()

                // Toggle status handler
                document.querySelectorAll('.toggle-status').forEach((btn) => {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault()
                        const holidayId = this.dataset.id
                        const currentStatus = this.dataset.status === 'true'
                        const newStatus = !currentStatus

                        Swal.fire({
                            text: `Are you sure you want to ${
                                newStatus ? 'activate' : 'deactivate'
                            } this holiday?`,
                            icon: 'warning',
                            showCancelButton: true,
                            buttonsStyling: false,
                            confirmButtonText: 'Yes, proceed!',
                            cancelButtonText: 'No, cancel',
                            customClass: {
                                confirmButton: 'btn fw-bold btn-primary',
                                cancelButton:
                                    'btn fw-bold btn-active-light-primary',
                            },
                        }).then(function (result) {
                            if (result.value) {
                                fetch(
                                    `/admin/holiday/toggle-status/${holidayId}`,
                                    {
                                        method: 'PATCH',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            isActive: newStatus,
                                        }),
                                    }
                                )
                                    .then((res) => res.json())
                                    .then((data) => {
                                        if (data.success) {
                                            toastr.success(data.message)
                                            dt.ajax.reload()
                                        } else {
                                            toastr.error(
                                                data.message ||
                                                    'Failed to change status'
                                            )
                                        }
                                    })
                                    .catch((error) => {
                                        toastr.error('Error changing status')
                                    })
                            }
                        })
                    })
                })
            })
        }

        return {
            init: function () {
                initDatatable()
            },
        }
    })()

    KTUtil.onDOMContentLoaded(function () {
        KTDatatablesServerSide.init()
    })
} catch (error) {
    console.log('ERR', error)
}
