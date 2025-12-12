try {
    ;('use strict')

    let subscriptionStatusBadge = {
        ACTIVE: 'success',
        PENDING: 'warning',
        EXPIRED: 'secondary',
        CANCELLED: 'danger',
    }

    let mealTypeIcons = {
        BREAKFAST:
            '<i class="ki-outline ki-coffee text-warning fs-5 me-1"></i>',
        LUNCH: '<i class="ki-outline ki-status text-success fs-5 me-1"></i>',
        DINNER: '<i class="ki-outline ki-night-day text-primary fs-5 me-1"></i>',
    }

    var KTDatatablesServerSide = (function () {
        var table
        var dt

        var initDatatable = function () {
            dt = $('#subscription_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[0, 'desc']],
                orderable: false,
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: {
                    url: `/admin/subscription/json`,
                    data: function (d) {
                        d.customerId = $('#subscription_customer_filter').val()
                        d.status = $('#subscription_status_filter').val()
                    },
                },
                columns: [
                    {
                        data: 'customer.name',
                        className: 'min-w-180px',
                        defaultContent: '<i>No Customer</i>',
                    },
                    {
                        data: 'startDate',
                        className: 'min-w-140px',
                    },
                    {
                        data: 'subscriptionMealTypes',
                        className: 'min-w-150px',
                    },
                    {
                        data: 'status',
                        className: 'min-w-80px',
                    },
                    {
                        data: '_count.orders',
                        className: 'min-w-70px',
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
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/subscription/edit/${
                                    row.id
                                }">
                                    ${row.customer?.name || 'N/A'}
                                </a>
                                <span class="text-muted fs-7">${
                                    row.customer?.mobile || ''
                                }</span>
                            </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            const start = new Date(row.startDate)
                            const end = new Date(row.endDate)
                            const now = new Date()

                            const startDate = start.toLocaleDateString()
                            const endDate = end.toLocaleDateString()

                            const msPerDay = 1000 * 60 * 60 * 24
                            const ceilDays = (ms) => Math.ceil(ms / msPerDay)

                            let badge = ''

                            if (now < start) {
                                // UPCOMING
                                const daysUntilStart = ceilDays(start - now)
                                badge = `<div class="badge badge-light-info fs-8 mt-1">Starts in ${daysUntilStart} day${
                                    daysUntilStart === 1 ? '' : 's'
                                }</div>`
                            } else if (now >= start && now <= end) {
                                // ACTIVE PERIOD
                                const daysLeft = ceilDays(end - now)
                                const tone =
                                    daysLeft <= 7
                                        ? 'danger'
                                        : daysLeft <= 30
                                        ? 'warning'
                                        : 'info'
                                badge = `<div class="badge badge-light-${tone} fs-8 mt-1">${daysLeft} day${
                                    daysLeft === 1 ? '' : 's'
                                } left</div>`
                            } else if (now > end) {
                                // ENDED
                                const daysPastEnd = ceilDays(now - end)
                                badge = `<div class="badge badge-light-secondary fs-8 mt-1">Ended ${daysPastEnd} day${
                                    daysPastEnd === 1 ? '' : 's'
                                } ago</div>`
                            }

                            return `
                        <div class="d-flex flex-column">
                            ${startDate} to ${endDate}
                            ${badge}
                        </div>
                        `
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            if (
                                !row.subscriptionMealTypes ||
                                row.subscriptionMealTypes.length === 0
                            ) {
                                return '<span class="text-muted">-</span>'
                            }

                            const mealTypes = row.subscriptionMealTypes
                                .map((mt) => {
                                    const mealType = mt.mealType
                                    if (!mealType) return ''

                                    const icon =
                                        mealTypeIcons[mealType.type] || ''
                                    return `
                                            <div class="d-flex align-items-center mb-1">
                                                ${icon}
                                                <span class="fs-7 ms-1">${mealType.name}</span>
                                            </div>
                                        `
                                })
                                .join('')

                            return `<div class="d-flex flex-column">${mealTypes}</div>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            let badgeClass =
                                subscriptionStatusBadge[data] || 'secondary'
                            let statusText = data || 'Unknown'
                            return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-center p-2">
                                <span class="fw-semibold fs-7">${statusText}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            return `<span class="badge badge-light-info">${
                                row._count?.orders || 0
                            }</span>`
                        },
                    },
                    {
                        targets: 5,
                        render: function (data, type, row) {
                            return `
                                <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
                                    data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                    Actions 
                                    <i class="ki-outline ki-down fs-5 ms-1"></i>
                                </a>
                                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4" data-kt-menu="true">

                                    <div class="menu-item px-3">
                                        <a href="/admin/subscription/edit/${
                                            row.id
                                        }" class="menu-link px-3">
                                            <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                                        </a>
                                    </div>
                                    ${
                                        row.status !== 'CANCELLED'
                                            ? `
                                    <div class="menu-item px-3">
                                        <a href="#" class="menu-link px-3 text-danger" data-action="cancel-subscription" data-subscription-id="${row.id}">
                                            <i class="ki-outline ki-close-circle fs-6 me-2"></i>Cancel Subscription
                                        </a>
                                    </div>
                                            `
                                            : ''
                                    }

                                </div>
                            `
                        },
                    },
                ],
            })

            table = dt.$

            // Customer filter
            let customerSelect = document.querySelector(
                '#subscription_customer_filter'
            )
            if (customerSelect) {
                fetch('/admin/subscription/customers')
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success) {
                            data.customers.forEach((customer) => {
                                let option = new Option(
                                    `${customer.name} (${customer.mobile})`,
                                    customer.id,
                                    false,
                                    false
                                )
                                $(customerSelect).append(option)
                            })
                            $(customerSelect).trigger('change')
                        }
                    })

                $(customerSelect).on('change', function () {
                    dt.ajax.reload()
                })

                let customerClearBtn = document.querySelector(
                    '#subscription_customer_clear'
                )
                if (customerClearBtn) {
                    customerClearBtn.addEventListener('click', function () {
                        $(customerSelect).val('').trigger('change')
                        dt.ajax.reload()
                    })
                }
            }

            // Search input
            const filterSearch = document.querySelector(
                '[data-kt-subscription-filter="search"]'
            )
            filterSearch?.addEventListener('keyup', (e) =>
                dt.search(e.target.value).draw()
            )

            // Status filter
            let statusSelect = document.querySelector(
                '#subscription_status_filter'
            )
            if (statusSelect) {
                $(statusSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            dt.on('draw', function (e) {
                if (window.KTMenu) KTMenu.createInstances()
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
        $('#subscription_table').on(
            'click',
            '[data-action="cancel-subscription"]',
            function (e) {
                e.preventDefault()
                const subscriptionId = $(this).data('subscription-id')

                Swal.fire({
                    title: 'Cancel Subscription?',
                    html: `
            <div class="text-start">
                <p class="mb-2">This action will:</p>
                <ul class="text-danger ms-3 mb-3" style="line-height:1.3;">
                    <li>Cancel <strong>all upcoming / future orders</strong> under this subscription.</li>
                    <li>This cannot be undone.</li>
                </ul>
                <p class="fw-bold text-dark mb-0">Do you want to continue?</p>
            </div>
        `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Continue',
                    cancelButtonText: 'No, Keep Subscription',
                    reverseButtons: true,
                    customClass: {
                        confirmButton: 'btn btn-danger',
                        cancelButton: 'btn btn-secondary',
                    },
                    buttonsStyling: false,
                }).then((first) => {
                    if (!first.isConfirmed) return

                    // SECOND CONFIRMATION
                    Swal.fire({
                        title: 'Final Confirmation',
                        text: 'Are you absolutely sure? This will permanently cancel all upcoming orders.',
                        icon: 'error',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, Cancel Subscription',
                        cancelButtonText: 'Go Back',
                        reverseButtons: true,
                        customClass: {
                            confirmButton: 'btn btn-danger',
                            cancelButton: 'btn btn-secondary',
                        },
                        buttonsStyling: false,
                    }).then((result) => {
                        if (!result.isConfirmed) return

                        Swal.fire({
                            title: 'Cancelling...',
                            text: 'Please wait.',
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            didOpen: () => Swal.showLoading(),
                            showConfirmButton: false,
                        })

                        fetch(`/admin/subscription/cancel/${subscriptionId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then((res) => res.json())
                            .then((data) => {
                                Swal.close()
                                if (data.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Subscription Cancelled',
                                        text: 'All future orders under this subscription have been canceled.',
                                        timer: 2000,
                                        showConfirmButton: false,
                                    })
                                    $('#subscription_table')
                                        .DataTable()
                                        .ajax.reload()
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Failed',
                                        text:
                                            data.message ||
                                            'Something went wrong.',
                                    })
                                }
                            })
                            .catch(() => {
                                Swal.close()
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Unexpected error occurred.',
                                })
                            })
                    })
                })
            }
        )
    })
} catch (error) {
    console.log('ERR', error)
}
