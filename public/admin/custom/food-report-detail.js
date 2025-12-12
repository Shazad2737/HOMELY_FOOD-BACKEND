try {
    ;('use strict')

    var KTFoodItemCountDetail = (function () {
        var ordersTable
        var customersTable
        var urlParams = new URLSearchParams(window.location.search)
        var date = urlParams.get('date')
        var foodItemId = urlParams.get('foodItemId')
        var mealTypeId = urlParams.get('mealTypeId')

        var loadFoodItemInfo = async function () {
            try {
                const response = await fetch(
                    `/admin/order/food-count/detail-data?date=${date}&foodItemId=${foodItemId}&mealTypeId=${mealTypeId}`
                )
                const data = await response.json()

                if (data.success) {
                    // Update header info
                    $('#food_name').text(data.foodItem.name)
                    $('#food_code').text(data.foodItem.code)
                    $('#selected_date').text(
                        moment(date).format('MMMM DD, YYYY')
                    )
                    $('#meal_type_name').text(data.mealType.name)
                    $('#category_name').text(data.category.name)

                    if (
                        data.foodItem.description &&
                        data.foodItem.description.trim()
                    ) {
                        $('#food_description').text(data.foodItem.description)
                        $('#food_description_container').show()
                    } else {
                        $('#food_description_container').hide()
                    }

                    // Update food image
                    if (data.foodItem.imageUrl) {
                        $('#food_image')
                            .attr('src', data.foodItem.imageUrl)
                            .show()
                        $('#food_icon').hide()
                    }

                    // Update stats
                    $('#total_orders').text(data.stats.totalOrders)
                    $('#total_customers').text(data.stats.uniqueCustomers)
                    $('#total_locations').text(data.stats.uniqueLocations)

                    // Load analytics
                    renderPlanDistribution(data.analytics.planDistribution)
                    renderLocationList(data.analytics.topLocations)
                    renderDeliveryStatus(data.analytics.deliveryStatus)
                } else {
                    toastr.error(
                        data.message || 'Failed to load food item details'
                    )
                }
            } catch (error) {
                console.error('Error loading food item info:', error)
                toastr.error('Failed to load food item details')
            }
        }

        var initOrdersTable = function () {
            ordersTable = $('#orders_table').DataTable({
                processing: true,
                serverSide: true,
                ajax: {
                    url: '/admin/order/food-count/orders-list',
                    data: function (d) {
                        d.date = date
                        d.foodItemId = foodItemId
                        d.mealTypeId = mealTypeId
                        d.search = $('#order_search').val()
                    },
                },
                columns: [
                    { data: 'order.orderNumber' },
                    { data: 'order.customer.name' },
                    { data: 'order.plan.name' },
                    { data: null },
                    { data: 'deliveredDate' },
                    // { data: 'quantity' },
                    { data: null },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            return `<a href="/admin/order/view/${row.order.id}" class="text-gray-800 text-hover-primary fw-bold">${data}</a>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <a href="/admin/customer/view/${
                                    row.order.customer.id
                                }" class="text-gray-800 text-hover-primary fw-bold mb-1">${data}</a>
                                <span class="text-muted fs-7">${
                                    row.order.customer.mobile || ''
                                }</span>
                            </div>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            let badgeClass = 'badge-light-info'
                            switch (row.order.plan.type) {
                                case 'BASIC':
                                    badgeClass = 'badge-light-info'
                                    break
                                case 'PREMIUM':
                                    badgeClass = 'badge-light-success'
                                    break
                                case 'ULTIMATE':
                                    badgeClass = 'badge-light-primary'
                                    break
                            }
                            return `<span class="badge ${badgeClass}">${data}</span>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            const loc = row.deliveryLocation
                            let address = []
                            if (loc.roomNumber) address.push(loc.roomNumber)
                            if (loc.buildingName) address.push(loc.buildingName)
                            if (loc.area) address.push(loc.area.name)

                            return `<div class="d-flex flex-column">
                                <span class="fw-semibold">${loc.type}</span>
                                <span class="text-muted fs-7">${
                                    address.join(', ') || 'N/A'
                                }</span>
                            </div>`
                        },
                    },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            if (data) {
                                const time = moment(data).format('hh:mm A')
                                return `<div class="d-flex flex-column">
                                    <span class="badge badge-light-success mb-1">Delivered</span>
                                    <span class="text-muted fs-7">${time}</span>
                                </div>`
                            }
                            return `<span class="badge badge-light-warning">Pending</span>`
                        },
                    },
                    // {
                    //     targets: 5,
                    //     render: function (data, type, row) {
                    //         return `<span class="badge badge-light-primary fs-6">${
                    //             data || 1
                    //         }</span>`
                    //     },
                    // },
                    {
                        targets: 5,
                        orderable: false,
                        render: function (data, type, row) {
                            return `
                                <div class="d-flex justify-content-end gap-2">
                                    <a href="/admin/order/view/${row.order.id}" class="btn btn-sm btn-light btn-active-light-primary">
                                        <i class="ki-outline ki-eye fs-5"></i>
                                        View
                                    </a>
                                </div>`
                        },
                    },
                ],
                order: [[0, 'asc']],
            })

            // Search functionality
            $('#order_search').on('keyup', function () {
                ordersTable.ajax.reload()
            })
        }

        var initCustomersTable = function () {
            customersTable = $('#customers_table').DataTable({
                processing: true,
                serverSide: true,
                ajax: {
                    url: '/admin/order/food-count/customers-list',
                    data: function (d) {
                        d.date = date
                        d.foodItemId = foodItemId
                        d.mealTypeId = mealTypeId
                    },
                },
                columns: [
                    { data: 'customer.name' },
                    { data: 'orderCount' },
                    { data: 'plan.name' },
                    { data: 'primaryLocation' },
                    { data: null },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            return `<div class="d-flex align-items-center">
                                <div class="symbol symbol-circle symbol-40px me-3">
                                    <div class="symbol-label bg-light-primary">
                                        <span class="text-primary fw-bold fs-4">${data
                                            .charAt(0)
                                            .toUpperCase()}</span>
                                    </div>
                                </div>
                                <div class="d-flex flex-column">
                                    <a href="/admin/customer/view/${
                                        row.customer.id
                                    }" class="text-gray-800 text-hover-primary fw-bold mb-1">${data}</a>
                                    <span class="text-muted fs-7">${
                                        row.customer.mobile || ''
                                    }</span>
                                </div>
                            </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data) {
                            return `<span class="badge badge-lg badge-light-primary">${data}</span>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            let badgeClass = 'badge-light-info'
                            switch (row.plan.type) {
                                case 'BASIC':
                                    badgeClass = 'badge-light-info'
                                    break
                                case 'PREMIUM':
                                    badgeClass = 'badge-light-success'
                                    break
                                case 'ULTIMATE':
                                    badgeClass = 'badge-light-primary'
                                    break
                            }
                            return `<span class="badge ${badgeClass}">${data}</span>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data) {
                            return data || '<span class="text-muted">N/A</span>'
                        },
                    },
                    {
                        targets: 4,
                        orderable: false,
                        render: function (data, type, row) {
                            return `<div class="d-flex justify-content-end">
                                <a href="/admin/customer/view/${row.customer.id}" class="btn btn-sm btn-light btn-active-light-primary">
                                    <i class="ki-outline ki-user fs-5"></i>
                                    View Profile
                                </a>
                            </div>`
                        },
                    },
                ],
                order: [[1, 'desc']],
            })
        }

        var renderPlanDistribution = function (planData) {
            const container = document.getElementById('plan_distribution_chart')
            if (!planData || planData.length === 0) {
                container.innerHTML =
                    '<div class="text-center py-10 text-muted">No plan data available</div>'
                return
            }

            let html = '<div class="d-flex flex-column gap-5">'
            const total = planData.reduce((sum, item) => sum + item.count, 0)

            planData.forEach((item) => {
                const percentage = ((item.count / total) * 100).toFixed(1)
                let colorClass = 'primary'
                switch (item.type) {
                    case 'BASIC':
                        colorClass = 'info'
                        break
                    case 'PREMIUM':
                        colorClass = 'success'
                        break
                    case 'ULTIMATE':
                        colorClass = 'primary'
                        break
                }

                html += `
                    <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                            <div class="symbol symbol-40px me-4">
                                <div class="symbol-label bg-light-${colorClass}">
                                    <i class="ki-outline ki-badge fs-2x text-${colorClass}"></i>
                                </div>
                            </div>
                            <div class="d-flex flex-column flex-grow-1">
                                <span class="text-gray-800 fw-bold fs-6">${item.name}</span>
                                <span class="text-muted fw-semibold fs-7">${item.count} orders (${percentage}%)</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="badge badge-light-${colorClass} fs-4">${item.count}</span>
                        </div>
                    </div>
                    <div class="separator"></div>
                `
            })
            html += '</div>'
            container.innerHTML = html
        }

        var renderLocationList = function (locationData) {
            const container = document.getElementById('location_list')
            if (!locationData || locationData.length === 0) {
                container.innerHTML =
                    '<div class="text-center py-10 text-muted">No location data available</div>'
                return
            }

            let html = '<div class="d-flex flex-column gap-4">'
            const maxCount = locationData[0]?.count || 1

            locationData.forEach((item, index) => {
                const percentage = ((item.count / maxCount) * 100).toFixed(0)
                const badgeColor =
                    index === 0 ? 'primary' : index === 1 ? 'success' : 'info'

                html += `
                    <div class="d-flex align-items-center">
                        <span class="badge badge-circle badge-${badgeColor} me-3">${
                    index + 1
                }</span>
                        <div class="d-flex flex-column flex-grow-1">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-gray-800 fw-semibold fs-6">${
                                    item.area
                                }</span>
                                <span class="text-gray-600 fw-bold fs-6">${
                                    item.count
                                }</span>
                            </div>
                            <div class="progress h-8px bg-light-${badgeColor}">
                                <div class="progress-bar bg-${badgeColor}" role="progressbar" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `
            })
            html += '</div>'
            container.innerHTML = html
        }

        var renderDeliveryStatus = function (statusData) {
            const container = document.getElementById('delivery_status_cards')
            if (!statusData) {
                container.innerHTML =
                    '<div class="col-12 text-center py-10 text-muted">No status data available</div>'
                return
            }

            const total = statusData.delivered + statusData.pending
            const deliveredPercent =
                total > 0
                    ? ((statusData.delivered / total) * 100).toFixed(1)
                    : 0

            container.innerHTML = `
                <div class="col-md-4">
                    <div class="card card-flush bg-light-success">
                        <div class="card-body text-center">
                            <i class="ki-outline ki-check-circle fs-3x text-success mb-3"></i>
                            <div class="fs-2hx fw-bold text-success">${statusData.delivered}</div>
                            <div class="fw-semibold text-gray-600">Delivered</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-flush bg-light-warning">
                        <div class="card-body text-center">
                            <i class="ki-outline ki-time fs-3x text-warning mb-3"></i>
                            <div class="fs-2hx fw-bold text-warning">${statusData.pending}</div>
                            <div class="fw-semibold text-gray-600">Pending</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-flush bg-light-primary">
                        <div class="card-body text-center">
                            <i class="ki-outline ki-chart-simple-2 fs-3x text-primary mb-3"></i>
                            <div class="fs-2hx fw-bold text-primary">${deliveredPercent}%</div>
                            <div class="fw-semibold text-gray-600">Completion Rate</div>
                        </div>
                    </div>
                </div>
            `
        }

        // Export orders
        $('#export_orders_btn').on('click', async function () {
            const btn = $(this)
            btn.attr('disabled', true)
            btn.find('i')
                .removeClass('ki-exit-down')
                .addClass('ki-arrows-circle')

            try {
                const response = await fetch(
                    '/admin/order/food-count/export-orders',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date, foodItemId, mealTypeId }),
                    }
                )

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                // Check if response is actually a file
                const contentType = response.headers.get('content-type')
                if (!contentType || !contentType.includes('spreadsheet')) {
                    const text = await response.text()
                    console.error('Response is not an Excel file:', text)
                    throw new Error('Invalid response format')
                }

                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `orders-${date}-${foodItemId}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toastr.success('Orders exported successfully')
            } catch (error) {
                console.error('Export error:', error)
                toastr.error('Failed to export orders: ' + error.message)
            } finally {
                btn.attr('disabled', false)
                btn.find('i')
                    .removeClass('ki-arrows-circle')
                    .addClass('ki-exit-down')
            }
        })

        return {
            init: function () {
                if (!date || !foodItemId || !mealTypeId) {
                    toastr.error('Invalid parameters')
                    setTimeout(() => {
                        window.location.href = '/admin/order/food-count'
                    }, 2000)
                    return
                }

                loadFoodItemInfo()
                initOrdersTable()
                initCustomersTable()
            },
        }
    })()

    KTUtil.onDOMContentLoaded(function () {
        KTFoodItemCountDetail.init()
    })
} catch (error) {
    console.log('ERR', error)
}
