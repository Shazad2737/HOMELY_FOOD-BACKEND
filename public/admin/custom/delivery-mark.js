try {
    ;('use strict')

    var KTDeliveryMarking = (function () {
        var table
        var dt

        var updateSummary = function () {
            // Get current data from the table
            const allData = dt.rows({ search: 'applied' }).data().toArray()

            const total = allData.length
            const delivered = allData.filter(
                (item) => item.deliveredDate !== null
            ).length
            const pending = total - delivered

            document.getElementById('total_items').textContent = total
            document.getElementById('pending_items').textContent = pending
            document.getElementById('delivered_items').textContent = delivered
        }

        var initDatatable = function () {
            // Initialize date range picker
            const today = new Date()
            $('#date_range_filter').daterangepicker(
                {
                    startDate: today,
                    endDate: today,
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
                        'This Month': [
                            moment().startOf('month'),
                            moment().endOf('month'),
                        ],
                        'Next 7 Days': [moment(), moment().add(6, 'days')],
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

            dt = $('#delivery_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[1, 'asc']],
                lengthMenu: [25, 50, 100, 200],
                pageLength: 100,
                ajax: {
                    url: `/admin/order/delivery/json`,
                    data: function (d) {
                        const picker =
                            $('#date_range_filter').data('daterangepicker')
                        if (picker) {
                            d.startDate = picker.startDate.format('YYYY-MM-DD')
                            d.endDate = picker.endDate.format('YYYY-MM-DD')
                        }
                        d.mealTypeId = $('#delivery_mealtype_filter').val()
                        d.status = $('#delivery_status_filter').val()
                    },
                    dataSrc: function (json) {
                        updateSummary()
                        return json.data
                    },
                },
                columns: [
                    { data: null, className: 'w-10px' },
                    { data: 'order.orderNumber', className: 'min-w-100px' },
                    { data: 'order.customer.name', className: 'min-w-150px' },
                    { data: 'mealType.name', className: 'min-w-120px' },
                    { data: 'foodItem.name', className: 'min-w-150px' },
                    { data: null, className: 'min-w-150px' },
                    // { data: 'quantity', className: 'min-w-80px' },
                    { data: 'deliveredDate', className: 'min-w-100px' },
                    { data: null, className: 'text-center min-w-100px' },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        orderable: false,
                        render: function (data, type, row) {
                            if (row.deliveredDate) {
                                return `<div class="form-check form-check-sm form-check-custom form-check-solid">
                                    <input class="form-check-input item-checkbox" type="checkbox" value="${row.id}" disabled>
                                </div>`
                            }
                            return `<div class="form-check form-check-sm form-check-custom form-check-solid">
                                <input class="form-check-input item-checkbox" type="checkbox" value="${row.id}">
                            </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            return `<a class="text-gray-800 text-hover-primary fw-bold" href="/admin/order/view/${row.order.id}">
                                ${row.order.orderNumber}
                            </a>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/customer/view/${
                                    row.order.customer.id
                                }">
                                    ${row.order.customer.name}
                                </a>
                                <span class="text-muted fs-7">${
                                    row.order.customer.mobile || ''
                                }</span>
                            </div>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            return `<span class="badge badge-light-primary">${row.mealType.name}</span>`
                        },
                    },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <span class="fw-semibold">${
                                    row.foodItem.name
                                }</span>
                                ${
                                    row.notes
                                        ? `<span class="text-muted fs-7">${row.notes}</span>`
                                        : ''
                                }
                            </div>`
                        },
                    },
                    {
                        targets: 5,
                        render: function (data, type, row) {
                            const location = row.deliveryLocation
                            let address = []
                            if (location.roomNumber)
                                address.push(location.roomNumber)
                            if (location.buildingName)
                                address.push(location.buildingName)
                            if (location.area) address.push(location.area.name)

                            return `<div class="d-flex flex-column">
                                <span class="fw-semibold">${
                                    location.type
                                }</span>
                                <span class="text-muted fs-7">${
                                    address.join(', ') || 'N/A'
                                }</span>
                            </div>`
                        },
                    },
                    // {
                    //     targets: 6,
                    //     render: function (data, type, row) {
                    //         return `<span class="badge badge-light-info">${
                    //             row.quantity || 1
                    //         }</span>`
                    //     },
                    // },
                    {
                        targets: 6,
                        render: function (data, type, row) {
                            if (row.deliveredDate) {
                                const deliveredTime = new Date(
                                    row.deliveredDate
                                ).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                return `<div class="d-flex flex-column">
                                    <span class="badge badge-light-success mb-1">
                                        <i class="ki-outline ki-check-circle fs-6 me-1"></i>Delivered
                                    </span>
                                    <span class="text-muted fs-7">${deliveredTime}</span>
                                </div>`
                            }
                            return `<span class="badge badge-light-warning">
                                <i class="ki-outline ki-time fs-6 me-1"></i>Pending
                            </span>`
                        },
                    },
                    {
                        targets: 7,
                        orderable: false,
                        render: function (data, type, row) {
                            if (row.deliveredDate) {
                                return `
                                    <button class="btn btn-sm btn-light-success btn-icon text-nowrap" disabled>
                                        <i class="ki-outline ki-check fs-2"></i>
                                    </button>`
                            }
                            return `
                                <button class="btn btn-sm btn-success mark-delivered-btn text-nowrap" 
                                        data-item-id="${row.id}"
                                        data-order-number="${row.order.orderNumber}">
                                    <i class="ki-outline ki-check fs-2"></i>
                                    Mark Delivered
                                </button>`
                        },
                    },
                ],
            })

            table = dt.$

            // Load meal types
            fetch('/admin/order/delivery/mealtypes')
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        const mealTypeSelect = $('#delivery_mealtype_filter')
                        data.mealTypes.forEach((mealType) => {
                            const option = new Option(
                                mealType.name,
                                mealType.id,
                                false,
                                false
                            )
                            mealTypeSelect.append(option)
                        })
                        mealTypeSelect.trigger('change')
                    }
                })

            // Search input
            const filterSearch = document.querySelector(
                '[data-kt-delivery-filter="search"]'
            )
            filterSearch?.addEventListener('keyup', (e) =>
                dt.search(e.target.value).draw()
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

            // Meal type filter
            $('#delivery_mealtype_filter').on('change', function () {
                dt.ajax.reload()
            })

            // Status filter
            $('#delivery_status_filter').on('change', function () {
                dt.ajax.reload()
            })

            // Clear filters button
            $('#clear_filters_btn').on('click', function () {
                // Reset date to today
                const today = moment()
                const picker = $('#date_range_filter').data('daterangepicker')
                if (picker) {
                    picker.setStartDate(today)
                    picker.setEndDate(today)
                }

                // Reset filters
                $('#delivery_mealtype_filter').val('').trigger('change')
                $('#delivery_status_filter').val('').trigger('change')

                dt.ajax.reload()
            })

            // Select all checkbox
            $('#select_all_checkbox').on('change', function () {
                const isChecked = this.checked
                $('.item-checkbox:not(:disabled)').prop('checked', isChecked)
            })

            // Mark single item as delivered
            $('#delivery_table').on(
                'click',
                '.mark-delivered-btn',
                function () {
                    const itemId = $(this).data('item-id')
                    const orderNumber = $(this).data('order-number')

                    markAsDelivered([itemId], `Order ${orderNumber} item`)
                }
            )

            // Mark all selected as delivered
            $('#mark_all_delivered_btn').on('click', function () {
                const selectedItems = []
                $('.item-checkbox:checked:not(:disabled)').each(function () {
                    selectedItems.push($(this).val())
                })

                if (selectedItems.length === 0) {
                    toastr.warning('Please select items to mark as delivered')
                    return
                }

                markAsDelivered(
                    selectedItems,
                    `${selectedItems.length} item(s)`
                )
            })

            // Refresh button
            $('#refresh_btn').on('click', function () {
                dt.ajax.reload()
                toastr.info('Data refreshed')
            })

            dt.on('draw', function () {
                updateSummary()
                // Reset select all checkbox on table redraw
                $('#select_all_checkbox').prop('checked', false)
            })
        }

        var markAsDelivered = async function (itemIds, description) {
            const result = await Swal.fire({
                text: `Are you sure you want to mark ${description} as delivered?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, deliver it!',
                cancelButtonText: 'Cancel',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'btn fw-bold btn-primary',
                    cancelButton: 'btn fw-bold btn-active-light-primary',
                },
            })

            if (!result.isConfirmed) return

            try {
                const res = await fetch(
                    '/admin/order/delivery/mark-delivered',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemIds }),
                    }
                )

                const data = await res.json()

                if (data.success) {
                    toastr.success(
                        data.message || 'Items marked as delivered successfully'
                    )
                    dt.ajax.reload(null, false)
                    $('#select_all_checkbox').prop('checked', false)
                } else {
                    toastr.error(
                        data.message || 'Failed to mark items as delivered'
                    )
                }
            } catch (err) {
                console.error(err)
                toastr.error('An error occurred')
            }
        }

        return {
            init: function () {
                initDatatable()
            },
        }
    })()

    KTUtil.onDOMContentLoaded(function () {
        KTDeliveryMarking.init()
    })
} catch (error) {
    console.log('ERR', error)
}
