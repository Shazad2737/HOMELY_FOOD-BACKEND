'use strict'

let orderReportTable
let currentFilters = {
    startDate: null,
    endDate: null,
    customerId: null,
    status: null,
    categoryId: null,
    planId: null,
}

$(document).ready(function () {
    initializeDateRangePicker()
    initializeFilters()
    initializeDataTable()
    bindEvents()
})

function initializeDateRangePicker() {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
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
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
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
            currentFilters.startDate = start.format('YYYY-MM-DD')
            currentFilters.endDate = end.format('YYYY-MM-DD')
            orderReportTable.ajax.reload()
        }
    )

    currentFilters.startDate = moment(firstDayOfMonth).format('YYYY-MM-DD')
    currentFilters.endDate = moment(lastDayOfMonth).format('YYYY-MM-DD')
}

function initializeFilters() {
    let customersLoaded = false
    let categoriesLoaded = false

    // Lazy load customers when dropdown is opened
    $('#customer_filter').on('select2:opening', function (e) {
        if (!customersLoaded) {
            e.preventDefault() // Prevent dropdown from opening until data is loaded
            
            const $select = $(this)
            
            $.ajax({
                url: '/admin/order/report/customers',
                method: 'GET',
                success: function (response) {
                    if (response.success && response.customers) {
                        response.customers.forEach((customer) => {
                            $select.append(
                                new Option(
                                    `${customer.name} (${customer.mobile})`,
                                    customer.id,
                                    false,
                                    false
                                )
                            )
                        })
                        customersLoaded = true
                        // Now open the dropdown with loaded data
                        $select.select2('open')
                    }
                },
                error: function () {
                    console.error('Failed to load customers')
                },
            })
        }
    })

    // Lazy load categories when dropdown is opened
    $('#category_filter').on('select2:opening', function (e) {
        if (!categoriesLoaded) {
            e.preventDefault() // Prevent dropdown from opening until data is loaded
            
            const $select = $(this)
            
            $.ajax({
                url: '/admin/order/report/categories',
                method: 'GET',
                success: function (response) {
                    if (response.success && response.categories) {
                        response.categories.forEach((category) => {
                            $select.append(
                                new Option(category.name, category.id, false, false)
                            )
                        })
                        categoriesLoaded = true
                        // Now open the dropdown with loaded data
                        $select.select2('open')
                    }
                },
                error: function () {
                    console.error('Failed to load categories')
                },
            })
        }
    })
}

function initializeDataTable() {
    orderReportTable = $('#order_report_table').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/admin/order/report/json',
            type: 'GET',
            data: function (d) {
                d.startDate = currentFilters.startDate
                d.endDate = currentFilters.endDate
                d.customerId = currentFilters.customerId
                d.status = currentFilters.status
                d.categoryId = currentFilters.categoryId
                d.planId = currentFilters.planId
            },
            dataSrc: function (json) {
                updateSummary(json.summary)
                return json.data
            },
        },
        columns: [
            {
                data: 'orderNumber',
                render: function (data, type, row) {
                    return `<a href="/admin/order/view/${row.id}" class="text-gray-800 text-hover-primary fw-bold">${data}</a>`
                },
            },
            {
                data: 'orderDate',
                render: function (data) {
                    const date = new Date(data)
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })
                },
            },
            {
                data: 'customer',
                render: function (data) {
                    return `
                        <div class="d-flex flex-column">
                            <span class="text-gray-800 fw-bold">${
                                data.name
                            }</span>
                            <span class="text-gray-600 fs-7">${
                                data.mobile || ''
                            }</span>
                            <span class="text-gray-500 fs-8">${
                                data.customerCode || ''
                            }</span>
                        </div>
                    `
                },
            },
            {
                data: 'category',
                render: function (data) {
                    return `<span class="badge badge-light-primary">${data.name}</span>`
                },
            },
            {
                data: 'plan',
                render: function (data) {
                    return `
                        <div class="d-flex flex-column">
                            <span class="text-gray-800">${data.name}</span>
                            <span class="text-gray-600 fs-7">${data.type}</span>
                        </div>
                    `
                },
            },
            {
                data: 'orderItems',
                orderable: false,
                render: function (data) {
                    if (!data || data.length === 0) {
                        return '<span class="text-muted">No items</span>'
                    }
                    return data
                        .map(
                            (item) => `
                        <div class="d-flex flex-column mb-2">
                            <span class="text-gray-800 fw-bold">${item.foodItem.name}</span>
                            <span class="text-gray-600 fs-7">${item.foodItem.code}</span>
                        </div>
                    `
                        )
                        .join('')
                },
            },
            {
                data: 'orderItems',
                orderable: false,
                render: function (data) {
                    if (!data || data.length === 0) {
                        return '<span class="text-muted">-</span>'
                    }
                    return data
                        .map(
                            (item) =>
                                `<span class="badge badge-light-info mb-1">${item.mealType.name}</span>`
                        )
                        .join('<br>')
                },
            },
            {
                data: 'orderItems',
                orderable: false,
                render: function (data) {
                    if (!data || data.length === 0) {
                        return '<span class="text-muted">-</span>'
                    }
                    return data
                        .map((item) => {
                            const loc = item.deliveryLocation
                            const address = [loc.roomNumber, loc.buildingName]
                                .filter(Boolean)
                                .join(', ')
                            return `
                        <div class="d-flex flex-column mb-2">
                            <span class="text-gray-800 fs-7">${
                                address || loc.name || ''
                            }</span>
                            <span class="text-gray-600 fs-8">${
                                loc.area?.name || ''
                            }</span>
                        </div>
                    `
                        })
                        .join('')
                },
            },
            {
                data: 'status',
                className: 'text-center',
                render: function (data) {
                    const statusClass =
                        data === 'CONFIRMED'
                            ? 'badge-light-success'
                            : data === 'DELIVERED'
                            ? 'badge-light-info'
                            : 'badge-light-danger'
                    return `<span class="badge ${statusClass}">${data}</span>`
                },
            },
            {
                data: null,
                className: 'text-end',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <a href="/admin/order/view/${row.id}" class="btn btn-sm btn-light btn-active-light-primary">
                            <i class="ki-outline ki-eye fs-5"></i>
                            View
                        </a>
                    `
                },
            },
        ],
        order: [[1, 'desc']],
        pageLength: 25,
        lengthMenu: [
            [10, 25, 50, 100],
            [10, 25, 50, 100],
        ],
        language: {
            emptyTable: 'No orders found',
            zeroRecords: 'No matching orders found',
        },
    })
}

function updateSummary(summary) {
    if (summary) {
        $('#total_orders').text(summary.totalOrders || 0)
        $('#active_orders').text(summary.activeOrders || 0)
        $('#cancelled_orders').text(summary.cancelledOrders || 0)
        $('#total_items').text(summary.totalItems || 0)
    }
}

function bindEvents() {
    // ---- Filter Change Handlers ----
    $('#customer_filter').on('change', function () {
        const v = $(this).val()
        currentFilters.customerId = v === '0' ? null : v
        orderReportTable.ajax.reload()
    })

    $('#status_filter').on('change', function () {
        const v = $(this).val()
        currentFilters.status = v === '0' ? null : v
        orderReportTable.ajax.reload()
    })

    $('#category_filter').on('change', function () {
        const v = $(this).val()
        const $planSelect = $('#plan_filter')
        
        currentFilters.categoryId = v === '0' ? null : v
        
        // Reset plan filter when category changes
        currentFilters.planId = null
        $planSelect.val(null)
        
        // Reset plan options
        $planSelect.find('option:not(:first):not([value="0"])').remove()

        if (v && v !== '0') {
            // Load plans for selected category
            $.ajax({
                url: `/admin/order/report/plans/by-category?categoryId=${v}`,
                method: 'GET',
                success: function (response) {
                    if (response.success && response.plans) {
                        response.plans.forEach((plan) => {
                            $planSelect.append(
                                new Option(plan.name, plan.id, false, false)
                            )
                        })
                    }
                },
                error: function () {
                    console.error('Failed to load plans for category')
                },
            })
        }
        
        orderReportTable.ajax.reload()
    })

    $('#plan_filter').on('change', function () {
        const v = $(this).val()
        currentFilters.planId = v === '0' ? null : v
        orderReportTable.ajax.reload()
    })

    // ---- Clear Filters ----
    $('#order_customer_clear').on('click', function () {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        const picker = $('#date_range_filter').data('daterangepicker')
        picker.setStartDate(firstDay)
        picker.setEndDate(lastDay)

        currentFilters = {
            startDate: moment(firstDay).format('YYYY-MM-DD'),
            endDate: moment(lastDay).format('YYYY-MM-DD'),
            customerId: null,
            status: null,
            categoryId: null,
            planId: null,
        }

        // Reset all dropdowns to placeholder (null)
        $('#customer_filter').val(null).trigger('change')
        $('#status_filter').val(null).trigger('change')
        $('#category_filter').val(null).trigger('change')
        $('#plan_filter').val(null).trigger('change')

        orderReportTable.ajax.reload()
    })

    // ---- Refresh ----
    $('#refresh_btn').on('click', function () {
        orderReportTable.ajax.reload()
    })

    // ---- Previous Day ----
    $('#prev_day_btn').on('click', function () {
        const picker = $('#date_range_filter').data('daterangepicker')
        const prev = moment(picker.startDate).subtract(1, 'day')

        picker.setStartDate(prev)
        picker.setEndDate(prev)

        currentFilters.startDate = prev.format('YYYY-MM-DD')
        currentFilters.endDate = prev.format('YYYY-MM-DD')

        orderReportTable.ajax.reload()
    })

    // ---- Today ----
    $('#today_btn').on('click', function () {
        const picker = $('#date_range_filter').data('daterangepicker')
        const today = moment()

        picker.setStartDate(today)
        picker.setEndDate(today)

        currentFilters.startDate = today.format('YYYY-MM-DD')
        currentFilters.endDate = today.format('YYYY-MM-DD')

        orderReportTable.ajax.reload()
    })

    // ---- Next Day ----
    $('#next_day_btn').on('click', function () {
        const picker = $('#date_range_filter').data('daterangepicker')
        const next = moment(picker.startDate).add(1, 'day')

        picker.setStartDate(next)
        picker.setEndDate(next)

        currentFilters.startDate = next.format('YYYY-MM-DD')
        currentFilters.endDate = next.format('YYYY-MM-DD')

        orderReportTable.ajax.reload()
    })

    // ---- Export Excel ----
    $('#export_btn').on('click', function () {
        const btn = $(this)
        btn.prop('disabled', true)
        btn.html('<span class="spinner-border spinner-border-sm"></span>')

        $.ajax({
            url: '/admin/order/report/export',
            method: 'POST',
            data: currentFilters,
            xhrFields: { responseType: 'blob' },

            success: function (blob, status, xhr) {
                const filename =
                    xhr
                        .getResponseHeader('Content-Disposition')
                        ?.split('filename=')[1]
                        ?.replace(/"/g, '') || 'order-report.xlsx'

                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                a.remove()

                window.URL.revokeObjectURL(url)
                toastr.success('Report exported successfully')
            },

            error: function () {
                toastr.error('Failed to export report')
            },

            complete: function () {
                btn.prop('disabled', false)
                btn.html('<i class="ki-outline ki-exit-down fs-2"></i>')
            },
        })
    })
}
