try {
    ;('use strict')

    var KTFoodItemCount = (function () {
        var table
        var dt
        var currentView = 'list' // 'list' or 'grid'
        var gridData = []
        var gridCurrentPage = 1
        var gridItemsPerPage = 12

        var updateSummary = function (summary) {
            document.getElementById('total_days').textContent =
                summary.totalDays || 0
            document.getElementById('total_food_items').textContent =
                summary.totalFoodItems || 0
            document.getElementById('total_orders').textContent =
                summary.totalOrders || 0
            document.getElementById('avg_items_per_day').textContent =
                summary.avgItemsPerDay || 0
        }

        var getDayOfWeek = function (dateString) {
            const date = new Date(dateString)
            const days = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ]
            return days[date.getDay()]
        }

        var formatDate = function (dateString) {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        }

        var getPlanBadgeClass = function (planType) {
            switch (planType) {
                case 'BASIC':
                    return 'badge-light-info'
                case 'PREMIUM':
                    return 'badge-light-success'
                case 'ULTIMATE':
                    return 'badge-light-primary'
                default:
                    return 'badge-light'
            }
        }

        var getMealTypeBadgeClass = function (mealTypeType) {
            switch (mealTypeType) {
                case 'BREAKFAST':
                    return 'badge-light-warning'
                case 'LUNCH':
                    return 'badge-light-success'
                case 'DINNER':
                    return 'badge-light-info'
                default:
                    return 'badge-light-primary'
            }
        }

        // Grid View Functions
        var renderGridView = function () {
            const container = document.getElementById('grid_view_items')
            container.innerHTML = ''

            const start = (gridCurrentPage - 1) * gridItemsPerPage
            const end = start + gridItemsPerPage
            const pageData = gridData.slice(start, end)

            if (pageData.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body text-center py-20">
                                <i class="ki-outline ki-information-5 fs-5x text-muted mb-5"></i>
                                <h3 class="text-gray-800 fs-2 fw-bold mb-2">No Data Available</h3>
                                <p class="text-gray-600">Try adjusting your filters or date range.</p>
                            </div>
                        </div>
                    </div>
                `
                return
            }

            pageData.forEach((item) => {
                const dayOfWeek = getDayOfWeek(item.date)
                const card = document.createElement('div')
                card.className = 'col-md-6 col-xl-4'
                card.innerHTML = `
                    <div class="card card-flush h-100 border border-gray-300 border-hover shadow-sm hover-elevate-up">
                        <div class="card-header pt-7">
                            <div class="card-title d-flex flex-column">
                                <div class="d-flex align-items-center mb-3">
                                    ${
                                        item.foodItemImage
                                            ? `<div class="symbol symbol-50px me-3">
                                        <img src="${item.foodItemImage}" alt="${item.foodItemName}" class="rounded">
                                    </div>`
                                            : '<div class="symbol symbol-50px me-3"><div class="symbol-label bg-light-primary"><i class="ki-outline ki-burger-menu fs-2x text-primary"></i></div></div>'
                                    }
                                    <div class="flex-grow-1">
                                        <span class="text-gray-800 text-hover-primary fw-bold fs-5 d-block">${
                                            item.foodItemName
                                        }</span>
                                        ${
                                            item.foodItemCode
                                                ? `<span class="text-muted fs-7">${item.foodItemCode}</span>`
                                                : ''
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-1">
                            <div class="d-flex flex-column gap-3">
                                <div class="d-flex align-items-center">
                                    <i class="ki-outline ki-calendar fs-3 text-gray-500 me-2"></i>
                                    <div class="flex-grow-1">
                                        <div class="fw-bold text-gray-800">${formatDate(
                                            item.date
                                        )}</div>
                                        <div class="text-muted fs-7">${dayOfWeek}</div>
                                    </div>
                                </div>
                                <div class="separator"></div>
                                <div class="d-flex flex-wrap gap-2">
                                    <span class="badge ${getMealTypeBadgeClass(
                                        item.mealTypeType
                                    )}">
                                        <i class="ki-outline ki-time fs-6 me-1"></i>${
                                            item.mealTypeName
                                        }
                                    </span>
                                    <span class="badge badge-light">
                                        <i class="ki-outline ki-category fs-6 me-1"></i>${
                                            item.categoryName
                                        }
                                    </span>
                                    <span class="badge ${getPlanBadgeClass(
                                        item.planType
                                    )}">
                                        <i class="ki-outline ki-badge fs-6 me-1"></i>${
                                            item.planName
                                        }
                                    </span>
                                </div>
                                <div class="separator"></div>
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div class="text-muted fs-7 fw-semibold">Order Count</div>
                                        <div class="fs-1 fw-bold text-primary">${
                                            item.count
                                        }</div>
                                    </div>
                                    <button class="btn btn-sm btn-primary view-details-btn" 
                                            data-date="${item.date}"
                                            data-food-id="${item.foodItemId}"
                                            data-meal-id="${item.mealTypeId}">
                                        <i class="ki-outline ki-eye fs-5"></i>
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
                container.appendChild(card)
            })

            renderGridPagination()
        }

        var renderGridPagination = function () {
            const totalPages = Math.ceil(gridData.length / gridItemsPerPage)
            const start = (gridCurrentPage - 1) * gridItemsPerPage + 1
            const end = Math.min(
                gridCurrentPage * gridItemsPerPage,
                gridData.length
            )

            // Update info
            document.getElementById(
                'grid_pagination_info'
            ).textContent = `Showing ${start} to ${end} of ${gridData.length} entries`

            // Render pagination
            const pagination = document.getElementById('grid_pagination')
            pagination.innerHTML = ''

            if (totalPages <= 1) return

            // Previous button
            const prevLi = document.createElement('li')
            prevLi.className = `page-item ${
                gridCurrentPage === 1 ? 'disabled' : ''
            }`
            prevLi.innerHTML = `
                <a class="page-link" href="#" data-page="${
                    gridCurrentPage - 1
                }">
                    <i class="ki-outline ki-arrow-left fs-5"></i>
                </a>
            `
            pagination.appendChild(prevLi)

            // Page numbers
            const startPage = Math.max(1, gridCurrentPage - 2)
            const endPage = Math.min(totalPages, gridCurrentPage + 2)

            if (startPage > 1) {
                const li = document.createElement('li')
                li.className = 'page-item'
                li.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`
                pagination.appendChild(li)

                if (startPage > 2) {
                    const dots = document.createElement('li')
                    dots.className = 'page-item disabled'
                    dots.innerHTML = '<span class="page-link">...</span>'
                    pagination.appendChild(dots)
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const li = document.createElement('li')
                li.className = `page-item ${
                    i === gridCurrentPage ? 'active' : ''
                }`
                li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`
                pagination.appendChild(li)
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const dots = document.createElement('li')
                    dots.className = 'page-item disabled'
                    dots.innerHTML = '<span class="page-link">...</span>'
                    pagination.appendChild(dots)
                }

                const li = document.createElement('li')
                li.className = 'page-item'
                li.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`
                pagination.appendChild(li)
            }

            // Next button
            const nextLi = document.createElement('li')
            nextLi.className = `page-item ${
                gridCurrentPage === totalPages ? 'disabled' : ''
            }`
            nextLi.innerHTML = `
                <a class="page-link" href="#" data-page="${
                    gridCurrentPage + 1
                }">
                    <i class="ki-outline ki-arrow-right fs-5"></i>
                </a>
            `
            pagination.appendChild(nextLi)
        }

        var switchView = function (view) {
            currentView = view

            if (view === 'grid') {
                $('#list_view_container').addClass('d-none')
                $('#grid_view_container').removeClass('d-none')
                $('#list_view_btn')
                    .removeClass('btn-primary active')
                    .addClass('btn-light-primary')
                $('#grid_view_btn')
                    .removeClass('btn-light-primary')
                    .addClass('btn-primary active')

                // Fetch all data for grid view
                loadGridData()
            } else {
                $('#grid_view_container').addClass('d-none')
                $('#list_view_container').removeClass('d-none')
                $('#grid_view_btn')
                    .removeClass('btn-primary active')
                    .addClass('btn-light-primary')
                $('#list_view_btn')
                    .removeClass('btn-light-primary')
                    .addClass('btn-primary active')
            }
        }

        var loadGridData = function () {
            const dateRange = $('#date_range_filter')
            $.ajax({
                url: '/admin/order/food-count/json',
                data: {
                    draw: 1,
                    start: 0,
                    length: 1000,
                    startDate:
                        dateRange.data('start-date') ||
                        moment().format('YYYY-MM-DD'),
                    endDate:
                        dateRange.data('end-date') ||
                        moment().format('YYYY-MM-DD'),
                    mealTypeId: $('#mealtype_filter').val(),
                    categoryId: $('#category_filter').val(),
                    planId: $('#plan_filter').val(),
                },
                success: function (response) {
                    gridData = response.data
                    gridCurrentPage = 1
                    renderGridView()
                },
                error: function () {
                    toastr.error('Failed to load grid data')
                },
            })
        }

        // Date Navigation Functions
        var navigateDate = function (direction) {
            const dateRangeInput = $('#date_range_filter')
            let startDate, endDate

            // Get current dates
            const currentStart = dateRangeInput.data('start-date')
                ? moment(dateRangeInput.data('start-date')).toDate()
                : new Date()
            const currentEnd = dateRangeInput.data('end-date')
                ? moment(dateRangeInput.data('end-date')).toDate()
                : new Date()

            // Calculate date range difference in days
            const daysDiff = moment(currentEnd).diff(
                moment(currentStart),
                'days'
            )

            if (direction === 'today') {
                startDate = new Date()
                endDate = new Date()
            } else if (direction === 'prev') {
                // Move both dates back by 1 day (or by the range difference)
                startDate = moment(currentStart).subtract(1, 'days').toDate()
                endDate = moment(currentEnd).subtract(1, 'days').toDate()
            } else if (direction === 'next') {
                // Move both dates forward by 1 day (or by the range difference)
                startDate = moment(currentStart).add(1, 'days').toDate()
                endDate = moment(currentEnd).add(1, 'days').toDate()
            }

            // Update Flatpickr
            if (window.dateRangePicker) {
                window.dateRangePicker.setDate([startDate, endDate], true)
            }
        }

        var initDatatable = function () {
            // Initialize Flatpickr with inline date navigation
            const dateRangePicker = flatpickr('#date_range_filter', {
                mode: 'range',
                dateFormat: 'Y-m-d',
                defaultDate: [new Date(), new Date()],
                allowInput: false,
                clickOpens: true,
                locale: {
                    rangeSeparator: ' to ',
                },
                onChange: function (selectedDates, dateStr, instance) {
                    if (selectedDates.length === 2) {
                        const startDate = moment(selectedDates[0]).format(
                            'YYYY-MM-DD'
                        )
                        const endDate = moment(selectedDates[1]).format(
                            'YYYY-MM-DD'
                        )

                        // Store dates
                        $('#date_range_filter').data('start-date', startDate)
                        $('#date_range_filter').data('end-date', endDate)

                        // Reload data
                        if (currentView === 'grid') {
                            loadGridData()
                        } else {
                            dt.ajax.reload()
                        }
                    } else if (selectedDates.length === 1) {
                        // Single date selected, treat as same day range
                        const singleDate = moment(selectedDates[0]).format(
                            'YYYY-MM-DD'
                        )
                        $('#date_range_filter').data('start-date', singleDate)
                        $('#date_range_filter').data('end-date', singleDate)

                        // Auto close and reload
                        instance.close()

                        if (currentView === 'grid') {
                            loadGridData()
                        } else {
                            dt.ajax.reload()
                        }
                    }
                },
            })

            // Store picker instance globally
            window.dateRangePicker = dateRangePicker

            // Set initial data attributes
            const today = moment().format('YYYY-MM-DD')
            $('#date_range_filter').data('start-date', today)
            $('#date_range_filter').data('end-date', today)

            dt = $('#food_count_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[0, 'desc']],
                lengthMenu: [25, 50, 100, 200],
                pageLength: 50,
                ajax: {
                    url: `/admin/order/food-count/json`,
                    data: function (d) {
                        const dateRange = $('#date_range_filter')
                        d.startDate =
                            dateRange.data('start-date') ||
                            moment().format('YYYY-MM-DD')
                        d.endDate =
                            dateRange.data('end-date') ||
                            moment().format('YYYY-MM-DD')
                        d.mealTypeId = $('#mealtype_filter').val()
                        d.categoryId = $('#category_filter').val()
                        d.planId = $('#plan_filter').val()
                    },
                    dataSrc: function (json) {
                        if (json.summary) {
                            updateSummary(json.summary)
                        }

                        if (json.summary && json.summary.totalCount) {
                            $('#footer_total_count').text(
                                json.summary.totalCount
                            )
                        }

                        return json.data
                    },
                },
                columns: [
                    { data: 'date', className: 'min-w-100px' },
                    { data: 'date', className: 'min-w-80px' },
                    { data: 'foodItemName', className: 'min-w-150px' },
                    { data: 'mealTypeName', className: 'min-w-120px' },
                    { data: 'categoryName', className: 'min-w-100px' },
                    { data: 'planName', className: 'min-w-80px' },
                    { data: 'count', className: 'min-w-80px text-center' },
                    { data: null, className: 'min-w-100px text-end' },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            return `<div class="d-flex flex-column">
                                <span class="text-gray-800 fw-bold">${formatDate(
                                    data
                                )}</span>
                                <span class="text-muted fs-7">${data}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            const dayOfWeek = getDayOfWeek(data)
                            let badgeClass = 'badge-light-primary'

                            if (dayOfWeek === 'Saturday') {
                                badgeClass = 'badge-light-info'
                            } else if (dayOfWeek === 'Sunday') {
                                badgeClass = 'badge-light-warning'
                            }

                            return `<span class="badge ${badgeClass}">${dayOfWeek}</span>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            return `<div class="d-flex align-items-center">
                                ${
                                    row.foodItemImage
                                        ? `<div class="symbol symbol-circle symbol-40px overflow-hidden me-3">
                                    <div class="symbol-label">
                                        <img src="${row.foodItemImage}" alt="${data}" class="w-100">
                                    </div>
                                </div>`
                                        : ''
                                }
                                <div class="d-flex flex-column">
                                    <span class="text-gray-800 fw-bold text-hover-primary">${data}</span>
                                    ${
                                        row.foodItemCode
                                            ? `<span class="text-muted fs-7">${row.foodItemCode}</span>`
                                            : ''
                                    }
                                </div>
                            </div>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            const badgeClass = getMealTypeBadgeClass(
                                row.mealTypeType
                            )
                            return `<span class="badge ${badgeClass}">${data}</span>`
                        },
                    },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            return `<span class="badge badge-light">${data}</span>`
                        },
                    },
                    {
                        targets: 5,
                        render: function (data, type, row) {
                            const badgeClass = getPlanBadgeClass(row.planType)
                            return `<span class="badge ${badgeClass}">${data}</span>`
                        },
                    },
                    {
                        targets: 6,
                        render: function (data, type, row) {
                            return `<span class="badge badge-lg badge-light-primary fs-4">${row.count}</span>`
                        },
                    },
                    {
                        targets: 7,
                        orderable: false,
                        render: function (data, type, row) {
                            return `
                                <button class="btn btn-sm btn-light btn-active-light-primary view-details-btn" 
                                        data-date="${row.date}"
                                        data-food-id="${row.foodItemId}"
                                        data-meal-id="${row.mealTypeId}">
                                    <i class="ki-outline ki-eye fs-5"></i>
                                    View Details
                                </button>`
                        },
                    },
                ],
                footerCallback: function (row, data, start, end, display) {
                    var api = this.api()
                    var pageTotal = api
                        .column(6, { page: 'current' })
                        .data()
                        .reduce(function (a, b) {
                            return a + b
                        }, 0)

                    $(api.column(6).footer()).html(
                        '<span class="badge badge-lg badge-primary fs-3">' +
                            pageTotal +
                            '</span>'
                    )
                },
            })

            table = dt.$

            // Load filters
            loadFilters()

            // Date navigation buttons
            $('#prev_day_btn').on('click', function () {
                navigateDate('prev')
            })

            $('#today_btn').on('click', function () {
                navigateDate('today')
            })

            $('#next_day_btn').on('click', function () {
                navigateDate('next')
            })

            // Filter changes
            $('#mealtype_filter, #plan_filter').on('change', function () {
                if (currentView === 'grid') {
                    loadGridData()
                } else {
                    dt.ajax.reload()
                }
            })

            // Clear filters button
            $('#clear_filters_btn').on('click', function () {
                // Reset date to today
                const today = new Date()
                if (window.dateRangePicker) {
                    window.dateRangePicker.setDate([today, today], true)
                }

                // Reset all select filters
                $('#mealtype_filter').val('').trigger('change')
                $('#category_filter').val('').trigger('change')
                $('#plan_filter').val('').trigger('change')

                toastr.info('Filters cleared')
            })

            // View toggle buttons
            $('#grid_view_btn').on('click', function () {
                switchView('grid')
            })

            $('#list_view_btn').on('click', function () {
                switchView('list')
            })

            // View details button (works for both grid and list)
            $(document).on('click', '.view-details-btn', function () {
                const date = $(this).data('date')
                const foodId = $(this).data('food-id')
                const mealId = $(this).data('meal-id')
                const url = `/admin/order/food-count/detail?date=${date}&foodItemId=${foodId}&mealTypeId=${mealId}`
                window.location.href = url
            })

            // Grid pagination clicks
            $(document).on(
                'click',
                '#grid_pagination .page-link',
                function (e) {
                    e.preventDefault()
                    const page = parseInt($(this).data('page'))
                    if (page && page !== gridCurrentPage) {
                        gridCurrentPage = page
                        renderGridView()
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                }
            )

            // Export button
            $('#export_btn').on('click', async function () {
                const dateRange = $('#date_range_filter')
                const startDate =
                    dateRange.data('start-date') ||
                    moment().format('YYYY-MM-DD')
                const endDate =
                    dateRange.data('end-date') || moment().format('YYYY-MM-DD')
                const mealTypeId = $('#mealtype_filter').val()
                const categoryId = $('#category_filter').val()
                const planId = $('#plan_filter').val()

                // Show loading
                const btn = $(this)
                btn.attr('disabled', true)
                btn.find('i')
                    .removeClass('ki-exit-down')
                    .addClass('ki-arrows-circle')

                try {
                    const response = await fetch(
                        '/admin/order/food-count/export',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                startDate,
                                endDate,
                                mealTypeId,
                                categoryId,
                                planId,
                            }),
                        }
                    )

                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`
                        )
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
                    a.download = `food-item-count-${startDate}-to-${endDate}.xlsx`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)

                    toastr.success('Report exported successfully')
                } catch (error) {
                    console.error('Export error:', error)
                    toastr.error('Failed to export report: ' + error.message)
                } finally {
                    // Restore button
                    btn.attr('disabled', false)
                    btn.find('i')
                        .removeClass('ki-arrows-circle')
                        .addClass('ki-exit-down')
                }
            })

            // Refresh button
            $('#refresh_btn').on('click', function () {
                if (currentView === 'grid') {
                    loadGridData()
                } else {
                    dt.ajax.reload()
                }
                toastr.info('Data refreshed')
            })
        }

        var loadFilters = function () {
            let mealTypesLoaded = false
            let categoriesLoaded = false
            let plansLoaded = false

            // Lazy load meal types when dropdown is opened
            $('#mealtype_filter').on('select2:opening', function (e) {
                if (!mealTypesLoaded) {
                    e.preventDefault()
                    
                    const $select = $(this)
                    
                    fetch('/admin/order/food-count/mealtypes')
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.success) {
                                data.mealTypes.forEach((item) => {
                                    $select.append(
                                        new Option(item.name, item.id, false, false)
                                    )
                                })
                                mealTypesLoaded = true
                                $select.select2('open')
                            }
                        })
                        .catch((err) => console.error('Error loading meal types:', err))
                }
            })

            // Lazy load categories when dropdown is opened
            $('#category_filter').on('select2:opening', function (e) {
                if (!categoriesLoaded) {
                    e.preventDefault()
                    
                    const $select = $(this)
                    
                    fetch('/admin/order/food-count/categories')
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.success) {
                                data.categories.forEach((item) => {
                                    $select.append(
                                        new Option(item.name, item.id, false, false)
                                    )
                                })
                                categoriesLoaded = true
                                $select.select2('open')
                            }
                        })
                        .catch((err) => console.error('Error loading categories:', err))
                }
            })

            // Category change handler - load plans based on selected category
            $('#category_filter').on('change', function () {
                const categoryId = $(this).val()
                const $planSelect = $('#plan_filter')
                
                // Reset plan options
                $planSelect.find('option:not(:first)').remove()
                plansLoaded = false

                if (categoryId) {
                    // Load plans for selected category
                    fetch(`/admin/order/food-count/plans/by-category?categoryId=${categoryId}`)
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.success) {
                                data.plans.forEach((plan) => {
                                    const displayName = `${plan.name} (${plan.type})`
                                    $planSelect.append(
                                        new Option(displayName, plan.id, false, false)
                                    )
                                })
                                plansLoaded = true
                            }
                        })
                        .catch((err) => console.error('Error loading plans:', err))
                }
                
                // Reload data
                if (currentView === 'grid') {
                    loadGridData()
                } else {
                    dt.ajax.reload()
                }
            })
        }

        return {
            init: function () {
                initDatatable()
            },
        }
    })()

    KTUtil.onDOMContentLoaded(function () {
        KTFoodItemCount.init()
    })
} catch (error) {
    console.log('ERR', error)
}
