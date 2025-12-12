import { prisma } from '../../../config/database.js'
import ExcelJS from 'exceljs'
import logger from '../../utils/logger.js'

export const foodItemCountJson = async (req, res) => {
    try {
        const {
            draw,
            start = 0,
            length = 100,
            startDate,
            endDate,
            mealTypeId,
            categoryId,
            planId,
        } = req.query

        const skip = parseInt(start)
        const take = parseInt(length)

        // Build where clause
        const where = {
            order: {
                customer: {
                    brandId: req.session.brandId, // Filter by brand
                },
            },
        }

        // Date range filter
        let dateFilter = {}
        if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            dateFilter = {
                gte: start,
                lte: end,
            }
        } else if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            dateFilter = { gte: start }
        } else if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter = { lte: end }
        } else {
            // Default to current week if no dates provided
            const today = new Date()
            const startOfWeek = new Date(today)
            startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0)

            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)
            endOfWeek.setHours(23, 59, 59, 999)

            dateFilter = {
                gte: startOfWeek,
                lte: endOfWeek,
            }
        }

        where.order.orderDate = dateFilter

        // Meal type filter
        if (mealTypeId) {
            where.mealTypeId = mealTypeId
        }

        // Category filter
        if (categoryId) {
            where.order.categoryId = categoryId
        }

        // Plan filter
        if (planId) {
            where.order.planId = planId
        }

        // Get order items with grouping
        const orderItems = await prisma.orderItem.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        orderDate: true,
                        orderNumber: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
                foodItem: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        imageUrl: true,
                    },
                },
                mealType: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: [
                { order: { orderDate: 'desc' } },
                { mealType: { sortOrder: 'asc' } },
            ],
        })

        // Group by date, foodItem, and mealType
        const groupedData = new Map()

        orderItems.forEach((item) => {
            const date = new Date(item.order.orderDate)
            const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
            const key = `${dateKey}_${item.foodItemId}_${item.mealTypeId}`

            if (!groupedData.has(key)) {
                groupedData.set(key, {
                    date: dateKey,
                    dateObj: date,
                    foodItemId: item.foodItem.id,
                    foodItemName: item.foodItem.name,
                    foodItemCode: item.foodItem.code,
                    foodItemImage: item.foodItem.imageUrl,
                    mealTypeId: item.mealType.id,
                    mealTypeName: item.mealType.name,
                    mealTypeType: item.mealType.type,
                    categoryId: item.order.category.id,
                    categoryName: item.order.category.name,
                    planId: item.order.plan.id,
                    planName: item.order.plan.name,
                    planType: item.order.plan.type,
                    count: 0,
                    orderIds: [],
                })
            }

            const group = groupedData.get(key)
            group.count += item.quantity || 1
            if (!group.orderIds.includes(item.order.id)) {
                group.orderIds.push(item.order.id)
            }
        })

        // Convert to array and sort
        const dataArray = Array.from(groupedData.values()).sort((a, b) => {
            // Sort by date desc, then meal type, then food item name
            if (a.dateObj > b.dateObj) return -1
            if (a.dateObj < b.dateObj) return 1
            if (a.mealTypeName < b.mealTypeName) return -1
            if (a.mealTypeName > b.mealTypeName) return 1
            if (a.foodItemName < b.foodItemName) return -1
            if (a.foodItemName > b.foodItemName) return 1
            return 0
        })

        // Calculate summary statistics
        const uniqueDates = new Set(dataArray.map((item) => item.date))
        const uniqueFoodItems = new Set(
            dataArray.map((item) => item.foodItemId)
        )
        const totalOrders = orderItems.length
        const totalCount = dataArray.reduce((sum, item) => sum + item.count, 0)

        // Pagination
        const paginatedData = dataArray.slice(skip, skip + take)

        // Get total count for the query
        const recordsTotal = await prisma.orderItem.count({
            where: {
                order: {
                    customer: {
                        brandId: req.session.brandId,
                    },
                },
            },
        })

        res.json({
            draw: parseInt(draw),
            recordsTotal,
            recordsFiltered: dataArray.length,
            data: paginatedData,
            summary: {
                totalDays: uniqueDates.size,
                totalFoodItems: uniqueFoodItems.size,
                totalOrders,
                totalCount,
                avgItemsPerDay:
                    uniqueDates.size > 0
                        ? (totalCount / uniqueDates.size).toFixed(1)
                        : 0,
            },
        })
    } catch (error) {
        logger.error('Error fetching food item count:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch food item count',
            error: error.message,
        })
    }
}

export const getCategories = async (req, res) => {
    const categories = await prisma.category.findMany({
        where: {
            brandId: req.session.brandId,
            isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            name: true,
        },
    })

    res.json({ success: true, categories })
}

export const getPlans = async (req, res) => {
    const plans = await prisma.plan.findMany({
        where: {
            isActive: true,
            category: {
                brandId: req.session.brandId,
            },
        },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            name: true,
            type: true,
        },
    })

    res.json({ success: true, plans })
}

export const getPlansByCategory = async (req, res) => {
    const { categoryId } = req.query

    const plans = await prisma.plan.findMany({
        where: { categoryId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, type: true },
    })

    return res.json({
        success: true,
        plans,
    })
}

export const getDetailData = async (req, res) => {
    const { date, foodItemId, mealTypeId } = req.query

    if (!date || !foodItemId || !mealTypeId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required parameters',
        })
    }

    // Parse date
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get order items
    const orderItems = await prisma.orderItem.findMany({
        where: {
            foodItemId,
            mealTypeId,
            order: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                customer: {
                    brandId: req.session.brandId,
                },
            },
        },
        include: {
            order: {
                include: {
                    customer: true,
                    plan: true,
                    category: true,
                },
            },
            foodItem: true,
            mealType: true,
            deliveryLocation: {
                include: {
                    area: true,
                },
            },
        },
    })

    if (orderItems.length === 0) {
        return res.json({
            success: false,
            error: 'No data found for the specified parameters',
        })
    }

    // Calculate stats
    const uniqueCustomers = new Set(
        orderItems.map((item) => item.order.customerId)
    ).size
    const uniqueLocations = new Set(
        orderItems
            .map((item) => item.deliveryLocation.area?.name)
            .filter(Boolean)
    ).size
    const deliveredCount = orderItems.filter(
        (item) => item.deliveredDate
    ).length

    // Plan distribution
    const planMap = new Map()
    orderItems.forEach((item) => {
        const plan = item.order.plan
        if (!planMap.has(plan.id)) {
            planMap.set(plan.id, {
                id: plan.id,
                name: plan.name,
                type: plan.type,
                count: 0,
            })
        }
        planMap.get(plan.id).count++
    })

    // Top locations
    const locationMap = new Map()
    orderItems.forEach((item) => {
        const areaName = item.deliveryLocation.area?.name || 'Unknown'
        locationMap.set(areaName, (locationMap.get(areaName) || 0) + 1)
    })
    const topLocations = Array.from(locationMap.entries())
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    res.json({
        success: true,
        foodItem: orderItems[0].foodItem,
        mealType: orderItems[0].mealType,
        category: orderItems[0].order.category,
        stats: {
            totalOrders: orderItems.length,
            uniqueCustomers,
            uniqueLocations,
        },
        analytics: {
            planDistribution: Array.from(planMap.values()),
            topLocations,
            deliveryStatus: {
                delivered: deliveredCount,
                pending: orderItems.length - deliveredCount,
            },
        },
    })
}

export const exportFoodItemCount = async (req, res) => {
    try {
        const { startDate, endDate, mealTypeId, categoryId, planId } = req.body

        // Build where clause (same as foodItemCountJson)
        const where = {
            order: {
                customer: {
                    brandId: req.session.brandId,
                },
            },
        }

        // Date range filter
        let dateFilter = {}
        if (startDate && endDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter = { gte: start, lte: end }
        } else if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            dateFilter = { gte: start }
        } else if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter = { lte: end }
        }

        if (Object.keys(dateFilter).length > 0) {
            where.order.orderDate = dateFilter
        }

        if (mealTypeId) {
            where.mealTypeId = mealTypeId
        }

        if (categoryId) {
            where.order.categoryId = categoryId
        }

        if (planId) {
            where.order.planId = planId
        }

        // Get all order items
        const orderItems = await prisma.orderItem.findMany({
            where,
            include: {
                order: {
                    select: {
                        orderDate: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                        plan: {
                            select: {
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
                foodItem: {
                    select: {
                        name: true,
                        code: true,
                        description: true,
                    },
                },
                mealType: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [
                { order: { orderDate: 'desc' } },
                { mealType: { sortOrder: 'asc' } },
            ],
        })

        // Group data
        const groupedData = new Map()
        orderItems.forEach((item) => {
            const date = new Date(item.order.orderDate)
            const dateKey = date.toISOString().split('T')[0]
            const key = `${dateKey}_${item.foodItemId}_${item.mealTypeId}`

            if (!groupedData.has(key)) {
                groupedData.set(key, {
                    date: dateKey,
                    dateObj: date,
                    foodItemName: item.foodItem.name,
                    foodItemCode: item.foodItem.code,
                    foodItemDescription: item.foodItem.description || '',
                    mealTypeName: item.mealType.name,
                    categoryName: item.order.category.name,
                    planName: item.order.plan.name,
                    planType: item.order.plan.type,
                    count: 0,
                })
            }

            const group = groupedData.get(key)
            group.count += item.quantity || 1
        })

        const dataArray = Array.from(groupedData.values()).sort(
            (a, b) => b.dateObj - a.dateObj
        )

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Food Item Count')

        // Define columns with proper settings
        worksheet.columns = [
            { key: 'col1', width: 12 }, // A - Date
            { key: 'col2', width: 12 }, // B - Day of Week
            { key: 'col3', width: 25 }, // C - Food Item
            { key: 'col4', width: 12 }, // D - Food Code
            { key: 'col5', width: 35 }, // E - Description
            { key: 'col6', width: 12 }, // F - Meal Type
            { key: 'col7', width: 12 }, // G - Category
            { key: 'col8', width: 15 }, // H - Plan
            { key: 'col9', width: 12 }, // I - Plan Type
            { key: 'col10', width: 10 }, // J - Count
        ]

        // Add header row manually
        const headerRow = worksheet.getRow(1)
        headerRow.values = [
            'Date',
            'Day of Week',
            'Food Item',
            'Food Code',
            'Description',
            'Meal Type',
            'Category',
            'Plan',
            'Plan Type',
            'Count',
        ]

        // Style header row - ONLY columns A to J (1 to 10)
        headerRow.font = { bold: true }
        headerRow.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: false,
        }
        headerRow.height = 20

        // Apply fill and borders ONLY to columns 1-10
        for (let col = 1; col <= 10; col++) {
            headerRow.getCell(col).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
            }
            headerRow.getCell(col).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            }
        }

        // Days of week array
        const daysOfWeek = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ]

        // Add data rows with formatting
        let rowNumber = 2
        dataArray.forEach((item) => {
            const date = new Date(item.date)
            const row = worksheet.getRow(rowNumber)

            row.values = [
                item.date,
                daysOfWeek[date.getDay()],
                item.foodItemName,
                item.foodItemCode,
                item.foodItemDescription,
                item.mealTypeName,
                item.categoryName,
                item.planName,
                item.planType,
                item.count,
            ]

            // Enable text wrapping for description column (E)
            row.getCell(5).alignment = {
                vertical: 'top',
                horizontal: 'left',
                wrapText: true,
            }

            // Center align other columns
            row.getCell(1).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(2).alignment = {
                vertical: 'middle',
                horizontal: 'left',
            }
            row.getCell(3).alignment = {
                vertical: 'middle',
                horizontal: 'left',
            }
            row.getCell(4).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(6).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(7).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(8).alignment = {
                vertical: 'middle',
                horizontal: 'left',
            }
            row.getCell(9).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(10).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }

            // Add borders ONLY to columns 1-10
            for (let col = 1; col <= 10; col++) {
                row.getCell(col).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                }
            }

            // Auto-adjust row height if description is long
            if (
                item.foodItemDescription &&
                item.foodItemDescription.length > 50
            ) {
                row.height = Math.min(
                    60,
                    Math.ceil(item.foodItemDescription.length / 50) * 15
                )
            }

            rowNumber++
        })

        // Add total row
        const totalRow = worksheet.getRow(rowNumber)
        totalRow.values = [
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            'TOTAL',
            dataArray.reduce((sum, item) => sum + item.count, 0),
        ]

        totalRow.font = { bold: true }
        totalRow.alignment = { vertical: 'middle', horizontal: 'center' }

        // Add borders to total row - ONLY columns 1-10
        for (let col = 1; col <= 10; col++) {
            totalRow.getCell(col).border = {
                top: { style: 'double' },
                left: { style: 'thin' },
                bottom: { style: 'double' },
                right: { style: 'thin' },
            }
        }

        // Set print options for better printing
        worksheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printArea: `A1:J${rowNumber}`,
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.75,
                bottom: 0.75,
                header: 0.3,
                footer: 0.3,
            },
        }

        // Freeze header row
        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

        // Set response headers
        const filename = `food-item-count-${
            new Date().toISOString().split('T')[0]
        }.xlsx`
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        )

        // Write to response
        await workbook.xlsx.write(res)
        res.end()
    } catch (error) {
        logger.error('Error exporting food item count:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
            error: error.message,
        })
    }
}

export const getOrdersList = async (req, res) => {
    try {
        const {
            draw,
            start = 0,
            length = 25,
            date,
            foodItemId,
            mealTypeId,
            search,
        } = req.query

        const skip = parseInt(start)
        const take = parseInt(length)

        // Parse date
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        const where = {
            foodItemId,
            mealTypeId,
            order: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                customer: {
                    brandId: req.session.brandId,
                },
            },
        }

        // Search filter
        if (search) {
            where.order.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ]
        }

        const [total, orderItems] = await Promise.all([
            prisma.orderItem.count({ where }),
            prisma.orderItem.findMany({
                where,
                skip,
                take,
                include: {
                    order: {
                        include: {
                            customer: true,
                            plan: true,
                        },
                    },
                    deliveryLocation: {
                        include: {
                            area: true,
                        },
                    },
                },
                orderBy: { order: { orderNumber: 'asc' } },
            }),
        ])

        res.json({
            draw: parseInt(draw),
            recordsTotal: total,
            recordsFiltered: total,
            data: orderItems,
        })
    } catch (error) {
        logger.error('Error fetching orders list:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message,
        })
    }
}

export const getCustomersList = async (req, res) => {
    const {
        draw,
        start = 0,
        length = 25,
        date,
        foodItemId,
        mealTypeId,
    } = req.query

    const skip = parseInt(start)
    const take = parseInt(length)

    // Parse date
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get order items
    const orderItems = await prisma.orderItem.findMany({
        where: {
            foodItemId,
            mealTypeId,
            order: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                customer: {
                    brandId: req.session.brandId,
                },
            },
        },
        include: {
            order: {
                include: {
                    customer: true,
                    plan: true,
                },
            },
            deliveryLocation: {
                include: {
                    area: true,
                },
            },
        },
    })

    // Group by customer
    const customerMap = new Map()
    orderItems.forEach((item) => {
        const customerId = item.order.customer.id
        if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
                customer: item.order.customer,
                plan: item.order.plan,
                orderCount: 0,
                primaryLocation: item.deliveryLocation.area?.name || 'N/A',
            })
        }
        customerMap.get(customerId).orderCount++
    })

    const customers = Array.from(customerMap.values()).sort(
        (a, b) => b.orderCount - a.orderCount
    )

    const paginatedCustomers = customers.slice(skip, skip + take)

    res.json({
        draw: parseInt(draw),
        recordsTotal: customers.length,
        recordsFiltered: customers.length,
        data: paginatedCustomers,
    })
}

export const exportDetailOrders = async (req, res) => {
    try {
        const { date, foodItemId, mealTypeId } = req.body

        if (!date || !foodItemId || !mealTypeId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
            })
        }

        // Parse date
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        // Get order items
        const orderItems = await prisma.orderItem.findMany({
            where: {
                foodItemId,
                mealTypeId,
                order: {
                    orderDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                    customer: {
                        brandId: req.session.brandId,
                    },
                },
            },
            include: {
                order: {
                    include: {
                        customer: true,
                        plan: true,
                        category: true,
                    },
                },
                foodItem: true,
                mealType: true,
                deliveryLocation: {
                    include: {
                        area: true,
                    },
                },
            },
            orderBy: { order: { orderNumber: 'asc' } },
        })

        if (orderItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found',
            })
        }

        // Get food item and meal type details from first item
        const foodItem = orderItems[0].foodItem
        const mealType = orderItems[0].mealType
        const category = orderItems[0].order.category

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Orders')

        // Set column widths FIRST
        worksheet.columns = [
            { key: 'col1', width: 15 }, // A - Order #
            { key: 'col2', width: 25 }, // B - Customer Name
            { key: 'col3', width: 15 }, // C - Mobile
            { key: 'col4', width: 15 }, // D - Plan
            { key: 'col5', width: 12 }, // E - Plan Type
            { key: 'col6', width: 15 }, // F - Location Type
            { key: 'col7', width: 22 }, // G - Room/Building
            { key: 'col8', width: 22 }, // H - Area
            { key: 'col9', width: 10 }, // I - Quantity
            { key: 'col10', width: 12 }, // J - Status
            { key: 'col11', width: 18 }, // K - Delivered At
        ]

        // Add Food Item Details Header Section
        worksheet.mergeCells('A1:K1')
        const titleRow = worksheet.getRow(1)
        titleRow.getCell('A').value = 'FOOD ITEM ORDER DETAILS'
        titleRow.getCell('A').font = { bold: true, size: 14 }
        titleRow.getCell('A').alignment = {
            horizontal: 'center',
            vertical: 'middle',
        }
        titleRow.height = 25

        // Add food item information
        worksheet.getRow(2).getCell('A').value = 'Date:'
        worksheet.getRow(2).getCell('B').value = new Date(
            date
        ).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        worksheet.getRow(3).getCell('A').value = 'Food Item:'
        worksheet.getRow(3).getCell('B').value = foodItem.name

        worksheet.getRow(4).getCell('A').value = 'Food Code:'
        worksheet.getRow(4).getCell('B').value = foodItem.code

        let currentInfoRow = 5
        if (foodItem.description) {
            worksheet.getRow(5).getCell('A').value = 'Description:'
            worksheet.getRow(5).getCell('B').value = foodItem.description
            // Merge cells B to K for long description
            worksheet.mergeCells(`B5:K5`)
            // Enable text wrapping for description
            worksheet.getRow(5).getCell('B').alignment = {
                vertical: 'top',
                horizontal: 'left',
                wrapText: true,
            }
            // Auto-adjust row height if description is long
            if (foodItem.description.length > 80) {
                worksheet.getRow(5).height = Math.min(
                    60,
                    Math.ceil(foodItem.description.length / 80) * 15
                )
            }
            currentInfoRow = 6
        }

        worksheet.getRow(currentInfoRow).getCell('A').value = 'Meal Type:'
        worksheet.getRow(currentInfoRow).getCell('B').value = mealType.name

        worksheet.getRow(currentInfoRow + 1).getCell('A').value = 'Category:'
        worksheet.getRow(currentInfoRow + 1).getCell('B').value = category.name

        // Make labels bold only
        for (let i = 2; i <= currentInfoRow + 1; i++) {
            worksheet.getRow(i).getCell('A').font = { bold: true }
        }

        // Add empty row
        const headerStartRow = currentInfoRow + 3

        // Add data table header
        const headerRow = worksheet.getRow(headerStartRow)
        headerRow.values = [
            'Order #',
            'Customer Name',
            'Mobile',
            'Plan',
            'Plan Type',
            'Location Type',
            'Room/Building',
            'Area',
            'Quantity',
            'Status',
            'Delivered At',
        ]

        // Style header (light gray background only for columns A-K)
        headerRow.font = { bold: true }
        headerRow.height = 20
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

        for (let col = 1; col <= 11; col++) {
            headerRow.getCell(col).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
            }
            headerRow.getCell(col).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            }
        }

        // Add data rows
        let currentRow = headerStartRow + 1
        orderItems.forEach((item) => {
            const loc = item.deliveryLocation
            let roomBuilding = []
            if (loc.roomNumber) roomBuilding.push(loc.roomNumber)
            if (loc.buildingName) roomBuilding.push(loc.buildingName)
            const roomBuildingText = roomBuilding.join(', ') || ''
            const areaText = loc.area?.name || ''

            const row = worksheet.getRow(currentRow)
            row.values = [
                item.order.orderNumber,
                item.order.customer.name,
                item.order.customer.mobile || '',
                item.order.plan.name,
                item.order.plan.type,
                loc.type,
                roomBuildingText,
                areaText,
                item.quantity || 1,
                item.deliveredDate ? 'DELIVERED' : 'PENDING',
                item.deliveredDate
                    ? new Date(item.deliveredDate).toLocaleString('en-US')
                    : '',
            ]

            // Set alignment for each cell
            row.getCell(1).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(2).alignment = {
                vertical: 'top',
                horizontal: 'left',
                wrapText: true,
            }
            row.getCell(3).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(4).alignment = {
                vertical: 'middle',
                horizontal: 'left',
            }
            row.getCell(5).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(6).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(7).alignment = {
                vertical: 'top',
                horizontal: 'left',
                wrapText: true,
            } // Room/Building with wrap
            row.getCell(8).alignment = {
                vertical: 'top',
                horizontal: 'left',
                wrapText: true,
            } // Area with wrap
            row.getCell(9).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(10).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }
            row.getCell(11).alignment = {
                vertical: 'middle',
                horizontal: 'center',
            }

            // Auto-adjust row height if Room/Building or Area text is long
            const maxLength = Math.max(roomBuildingText.length, areaText.length)
            if (maxLength > 30) {
                row.height = Math.min(45, Math.ceil(maxLength / 30) * 15)
            }

            // Add borders to all cells
            for (let j = 1; j <= 11; j++) {
                row.getCell(j).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                }
            }

            currentRow++
        })

        // Add summary row
        const totalQty = orderItems.reduce(
            (sum, item) => sum + (item.quantity || 1),
            0
        )
        const summaryRow = worksheet.getRow(currentRow)
        summaryRow.getCell(8).value = 'TOTAL:'
        summaryRow.getCell(9).value = totalQty
        summaryRow.font = { bold: true }
        summaryRow.alignment = { vertical: 'middle', horizontal: 'center' }

        // Add borders to summary row
        for (let j = 1; j <= 11; j++) {
            summaryRow.getCell(j).border = {
                top: { style: 'double', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'double', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            }
        }

        // Set print options for better printing
        worksheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printArea: `A1:K${currentRow}`,
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.75,
                bottom: 0.75,
                header: 0.3,
                footer: 0.3,
            },
        }

        // Freeze header row
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: headerStartRow },
        ]

        // Set response headers
        const filename = `orders-${date}-${foodItem.name.replace(
            /\s+/g,
            '-'
        )}.xlsx`
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        )

        // Write to response
        await workbook.xlsx.write(res)
        res.end()
    } catch (error) {
        logger.error('Error exporting orders:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to export orders',
            error: error.message,
        })
    }
}
