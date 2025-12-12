import { prisma } from '../../../config/database.js'
import ExcelJS from 'exceljs'
import logger from '../../utils/logger.js'

export const orderReportPage = async (req, res) => {
    res.render('admin/orderReport/list')
}

export const orderReportJson = async (req, res) => {
    try {
        const {
            draw,
            start = 0,
            length = 100,
            startDate,
            endDate,
            customerId,
            status,
            categoryId,
            planId,
        } = req.query

        const skip = parseInt(start)
        const take = parseInt(length)

        // Build where clause
        const where = {
            customer: {
                brandId: req.session.brandId,
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
        } else {
            // Default to current month if no dates provided
            const today = new Date()
            const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
            startOfMonth.setHours(0, 0, 0, 0)
            const endOfMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            )
            endOfMonth.setHours(23, 59, 59, 999)
            dateFilter = { gte: startOfMonth, lte: endOfMonth }
        }

        where.orderDate = dateFilter

        // Customer filter
        if (customerId) {
            where.customerId = customerId
        }

        // Status filter
        if (status) {
            where.status = status
        }

        // Category filter
        if (categoryId) {
            where.categoryId = categoryId
        }

        // Plan filter
        if (planId) {
            where.planId = planId
        }

        // Get orders
        const [totalRecords, orders, summaryData] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                skip,
                take,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            mobile: true,
                            customerCode: true,
                        },
                    },
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
                    subscription: {
                        select: {
                            id: true,
                            startDate: true,
                            endDate: true,
                        },
                    },
                    orderItems: {
                        include: {
                            foodItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                            mealType: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                            deliveryLocation: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    roomNumber: true,
                                    buildingName: true,
                                    area: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { orderDate: 'desc' },
            }),
            prisma.order.findMany({
                where,
                select: {
                    status: true,
                    orderItems: {
                        select: {
                            quantity: true,
                        },
                    },
                },
            }),
        ])

        // Calculate summary statistics
        const summary = {
            totalOrders: summaryData.length,
            activeOrders: summaryData.filter(
                (o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED'
            ).length,
            cancelledOrders: summaryData.filter((o) => o.status === 'CANCELLED')
                .length,
            totalItems: summaryData.reduce(
                (sum, order) =>
                    sum +
                    order.orderItems.reduce(
                        (itemSum, item) => itemSum + (item.quantity || 1),
                        0
                    ),
                0
            ),
        }

        res.json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: totalRecords,
            data: orders,
            summary,
        })
    } catch (error) {
        logger.error('Error fetching order report:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order report',
            error: error.message,
        })
    }
}

export const exportOrderReport = async (req, res) => {
    try {
        const { startDate, endDate, customerId, status, categoryId, planId } =
            req.body

        // WHERE CLAUSE - Match the same logic as orderReportJson
        const where = {
            customer: { brandId: req.session.brandId },
        }

        // Date range filter - same logic as orderReportJson
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
        } else {
            // Default to current month if no dates provided
            const today = new Date()
            const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
            startOfMonth.setHours(0, 0, 0, 0)
            const endOfMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            )
            endOfMonth.setHours(23, 59, 59, 999)
            dateFilter = { gte: startOfMonth, lte: endOfMonth }
        }

        where.orderDate = dateFilter

        if (customerId) where.customerId = customerId
        if (status) where.status = status
        if (categoryId) where.categoryId = categoryId
        if (planId) where.planId = planId

        // FETCH ORDERS
        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: {
                    select: {
                        name: true,
                        mobile: true,
                        customerCode: true,
                    },
                },
                category: { select: { name: true } },
                plan: { select: { name: true } },
                orderItems: {
                    include: {
                        foodItem: { select: { name: true, code: true } },
                        mealType: { select: { name: true } },
                        deliveryLocation: {
                            select: {
                                name: true,
                                roomNumber: true,
                                buildingName: true,
                                area: { select: { name: true } },
                                location: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { orderDate: 'desc' },
        })

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for the selected criteria',
            })
        }

        // EXCEL WORKBOOK
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('Order Report')

        // COLUMNS
        sheet.columns = [
            { key: 'orderDate', width: 12 },
            { key: 'orderNumber', width: 15 },
            { key: 'customerName', width: 25 },
            { key: 'customerMobile', width: 15 },
            { key: 'customerCode', width: 15 },
            { key: 'category', width: 20 },
            { key: 'plan', width: 15 },
            { key: 'mealType', width: 15 },
            { key: 'productCode', width: 15 },
            { key: 'productName', width: 25 },
            { key: 'deliveryDate', width: 15 },
            { key: 'deliveryAddress', width: 25 },
            { key: 'deliveryArea', width: 15 },
            { key: 'deliveryLocation', width: 25 },
            { key: 'status', width: 12 },
        ]

        // HEADER
        sheet.addRow([
            'Order Date',
            'Order Number',
            'Customer Name',
            'Customer Mobile',
            'Customer ID',
            'Food Category',
            'Food Plan',
            'Meal Type',
            'Product Code',
            'Product Name',
            'Delivery Date',
            'Delivery Address',
            'Delivery Area',
            'Delivery Location (Emirates)',
            'Status',
        ])

        const header = sheet.getRow(1)
        header.font = { bold: true }
        header.alignment = { vertical: 'middle', horizontal: 'center' }
        header.height = 18

        header.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
            }
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            }
        })

        // DATA ROWS
        orders.forEach((order) => {
            const orderDate = order.orderDate
                ? order.orderDate.toISOString().split('T')[0]
                : ''

            if (!order.orderItems.length) {
                sheet.addRow([
                    orderDate,
                    order.orderNumber,
                    order.customer.name,
                    order.customer.mobile || '',
                    order.customer.customerCode || '',
                    order.category.name,
                    order.plan.name,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    order.status,
                ])
                return
            }

            order.orderItems.forEach((item) => {
                const deliveryAddress = [
                    item.deliveryLocation.roomNumber,
                    item.deliveryLocation.buildingName,
                ]
                    .filter(Boolean)
                    .join(', ')

                sheet.addRow([
                    orderDate,
                    order.orderNumber,
                    order.customer.name,
                    order.customer.mobile || '',
                    order.customer.customerCode || '',
                    order.category.name,
                    order.plan.name,
                    item.mealType.name,
                    item.foodItem.code,
                    item.foodItem.name,
                    item.deliveredDate
                        ? new Date(item.deliveredDate).toLocaleDateString(
                              'en-US'
                          )
                        : '',
                    deliveryAddress,
                    item.deliveryLocation.area?.name || '',
                    item.deliveryLocation.location?.name || '',
                    order.status,
                ])
            })
        })

        // STYLING FOR DATA ROWS
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return
            row.height = 16

            row.eachCell((cell) => {
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                    wrapText: true,
                }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                }
            })
        })

        // FREEZE HEADER
        sheet.views = [{ state: 'frozen', ySplit: 1 }]

        // SEND FILE
        const filename = `order-report-${
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

        await workbook.xlsx.write(res)
        res.end()
    } catch (error) {
        logger.error('Error exporting order report:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to export order report',
            error: error.message,
        })
    }
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

export const getCustomers = async (req, res) => {
    const brandId = req.session.brandId

    const customers = await prisma.customer.findMany({
        where: { brandId, status: 'ACTIVE' },
        select: {
            id: true,
            name: true,
            mobile: true,
            customerCode: true,
        },
        orderBy: { name: 'asc' },
    })

    return res.json({
        success: true,
        customers,
    })
}

export const getCategoriesList = async (req, res) => {
    const brandId = req.session.brandId

    const categories = await prisma.category.findMany({
        where: { brandId, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
    })

    return res.json({
        success: true,
        categories,
    })
}
