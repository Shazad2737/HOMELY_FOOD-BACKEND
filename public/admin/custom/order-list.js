try {
    ;('use strict')

    let orderStatusBadge = {
        CONFIRMED: 'primary',
        DELIVERED: 'success',
        CANCELLED: 'danger',
    }

    var KTDatatablesServerSide = (function () {
        var table
        var dt

        var initDatatable = function () {
            dt = $('#order_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[0, 'desc']],
                orderable: false,
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: {
                    url: `/admin/order/json`,
                    data: function (d) {
                        d.customerId = $('#order_customer_filter').val()
                        d.status = $('#order_status_filter').val()
                        const picker =
                            $('#date_range_filter').data('daterangepicker')
                        if (picker) {
                            d.startDate = picker.startDate.format('YYYY-MM-DD')
                            d.endDate = picker.endDate.format('YYYY-MM-DD')
                        }
                    },
                },
                columns: [
                    {
                        data: 'orderNumber',
                        className: 'min-w-120px',
                    },
                    {
                        data: 'customer.name',
                        className: 'min-w-180px',
                        defaultContent: '<i>No Customer</i>',
                    },
                    {
                        data: 'orderDate',
                        className: 'min-w-120px',
                    },
                    {
                        data: 'category.name',
                        className: 'min-w-150px',
                    },
                    // {
                    //     data: 'totalAmount',
                    //     className: 'min-w-100px',
                    // },
                    {
                        data: 'status',
                        className: 'min-w-80px',
                    },
                    {
                        data: '_count.orderItems',
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
                            return `<a class="text-gray-800 text-hover-primary fw-bold" href="/admin/order/view/${row.id}">
                                ${row.orderNumber}
                            </a>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/order/view/${
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
                        targets: 2,
                        render: function (data, type, row) {
                            const orderDate = new Date(
                                row.orderDate
                            ).toLocaleDateString()
                            const createdDate = new Date(
                                row.orderCreatedDate
                            ).toLocaleDateString()

                            return `<div class="d-flex flex-column">
                                <span class="fw-bold">${orderDate}</span>
                                <span class="text-muted fs-7">Created: ${createdDate}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <span class="fw-semibold">${
                                    row.category?.name || 'N/A'
                                }</span>
                                <span class="text-muted fs-7">${
                                    row.plan?.name || 'N/A'
                                }</span>
                            </div>`
                        },
                    },
                    // {
                    //     targets: 4,
                    //     render: function (data, type, row) {
                    //         const amount = row.totalAmount
                    //             ? parseFloat(row.totalAmount)
                    //             : 0
                    //         return `<span class="fw-bold">₹${amount.toFixed(
                    //             2
                    //         )}</span>`
                    //     },
                    // },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            let badgeClass =
                                orderStatusBadge[data] || 'secondary'
                            let statusText = data || 'Unknown'
                            return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-center p-2">
                                <span class="fw-semibold fs-7">${statusText}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 5,
                        render: function (data, type, row) {
                            return `<span class="badge badge-light-info">${
                                row._count?.orderItems || 0
                            }</span>`
                        },
                    },
                    {
                        targets: 6,
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
                                        <a href="/admin/order/view/${
                                            row.id
                                        }" class="menu-link px-3">
                                            <i class="ki-outline ki-eye fs-6 me-2"></i>View Details
                                        </a>
                                    </div>
                                    ${
                                        row.status !== 'CANCELLED'
                                            ? `
                                    <div class="menu-item px-3">
                                        <a href="#" class="menu-link px-3 text-danger" data-order-id="${row.id}" data-action="cancel">
                                            <i class="ki-outline ki-cross-circle fs-6 me-2"></i>Cancel Order
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
                '#order_customer_filter'
            )
            if (customerSelect) {
                fetch('/admin/order/customers')
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
                    '#order_customer_clear'
                )
                if (customerClearBtn) {
                    customerClearBtn.addEventListener('click', function () {
                        // Reset customer filter
                        $(customerSelect).val('').trigger('change')

                        // Reset status filter
                        $('#order_status_filter').val('').trigger('change')

                        // Reset date range to this month
                        const today = new Date()
                        const firstDay = new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            1
                        )
                        const lastDay = new Date(
                            today.getFullYear(),
                            today.getMonth() + 1,
                            0
                        )
                        const picker =
                            $('#date_range_filter').data('daterangepicker')
                        if (picker) {
                            picker.setStartDate(firstDay)
                            picker.setEndDate(lastDay)
                        }

                        dt.ajax.reload()
                    })
                }
            }

            // Search input
            const filterSearch = document.querySelector(
                '[data-kt-order-filter="search"]'
            )
            filterSearch?.addEventListener('keyup', (e) =>
                dt.search(e.target.value).draw()
            )

            // Status filter
            let statusSelect = document.querySelector('#order_status_filter')
            if (statusSelect) {
                $(statusSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Date range picker initialization
            const today = new Date()
            const firstDayOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
            const lastDayOfMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            )

            $('#date_range_filter').daterangepicker(
                {
                    startDate: firstDayOfMonth,
                    endDate: lastDayOfMonth,
                    locale: {
                        format: 'YYYY-MM-DD',
                    },
                    ranges: {
                        Today: [moment(), moment()],
                        Yesterday: [
                            moment().subtract(1, 'days'),
                            moment().subtract(1, 'days'),
                        ],
                        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                        'Last 30 Days': [
                            moment().subtract(29, 'days'),
                            moment(),
                        ],
                        'This Month': [
                            moment().startOf('month'),
                            moment().endOf('month'),
                        ],
                        'Last Month': [
                            moment().subtract(1, 'month').startOf('month'),
                            moment().subtract(1, 'month').endOf('month'),
                        ],
                        'Next 7 Days': [moment(), moment().add(6, 'days')],
                        'Next 30 Days': [moment(), moment().add(29, 'days')],
                        'Next Month': [
                            moment().add(1, 'month').startOf('month'),
                            moment().add(1, 'month').endOf('month'),
                        ],
                    },
                },
                function (start, end) {
                    dt.ajax.reload()
                }
            )

            // Date navigation buttons
            $('#prev_day_btn').on('click', function () {
                const picker = $('#date_range_filter').data('daterangepicker')
                const prev = moment(picker.startDate).subtract(1, 'day')
                picker.setStartDate(prev)
                picker.setEndDate(prev)
                dt.ajax.reload()
            })

            $('#today_btn').on('click', function () {
                const picker = $('#date_range_filter').data('daterangepicker')
                const today = moment()
                picker.setStartDate(today)
                picker.setEndDate(today)
                dt.ajax.reload()
            })

            $('#next_day_btn').on('click', function () {
                const picker = $('#date_range_filter').data('daterangepicker')
                const next = moment(picker.startDate).add(1, 'day')
                picker.setStartDate(next)
                picker.setEndDate(next)
                dt.ajax.reload()
            })

            // Handle cancel order action
            $('#order_table').on(
                'click',
                '[data-action="cancel"]',
                function (e) {
                    e.preventDefault()
                    const orderId = $(this).data('order-id')

                    Swal.fire({
                        title: 'Cancel Order?',
                        text: 'Are you sure you want to cancel this order?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, Cancel Order',
                        cancelButtonText: 'No, Keep It',
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
                            text: 'Please wait while we cancel the order.',
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            didOpen: () => Swal.showLoading(),
                            showConfirmButton: false,
                        })

                        fetch(`/admin/order/cancel/${orderId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then((res) => res.json())
                            .then((data) => {
                                Swal.close()

                                if (data.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Order Cancelled!',
                                        text: 'The order has been successfully cancelled.',
                                        timer: 2000,
                                        showConfirmButton: false,
                                    })
                                    dt.ajax.reload()
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Failed!',
                                        text:
                                            data.message ||
                                            'Failed to cancel the order.',
                                    })
                                }
                            })
                            .catch((err) => {
                                Swal.close()
                                console.error(err)
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error!',
                                    text: 'An unexpected error occurred while cancelling the order.',
                                })
                            })
                    })
                }
            )

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
    })
} catch (error) {
    console.log('ERR', error)
}
