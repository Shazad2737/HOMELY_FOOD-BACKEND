import express from 'express'
import { asyncHandler } from '../../middlewares/validation.middleware.js'
import {
    cancelOrder,
    getCustomersForFilter,
    orderList,
    orderListJson,
    orderView,
} from '../../controllers/admin/order.controller.js'
import {
    deliveryJson,
    deliveryMarkingPage,
    getMealTypes,
    markAsDelivered,
} from '../../controllers/admin/delivery.controller.js'
import {
    exportDetailOrders,
    exportFoodItemCount,
    foodItemCountJson,
    getCategories,
    getCustomersList,
    getDetailData,
    getOrdersList,
    getPlans,
    getPlansByCategory,
} from '../../controllers/admin/food-report.controller.js'
import {
    exportOrderReport,
    getCategoriesList,
    getCustomers,
    // getPlansByCategory,
    orderReportJson,
    orderReportPage,
} from '../../controllers/admin/order-report.controller.js'

const router = express.Router()

// === Order ===
router.get('/', asyncHandler(orderList))
router.get('/json', asyncHandler(orderListJson))
router.get('/view/:id', asyncHandler(orderView))
router.post('/cancel/:id', asyncHandler(cancelOrder))

// === Delivery ===
router.get('/delivery/marking', asyncHandler(deliveryMarkingPage))
router.get('/delivery/json', asyncHandler(deliveryJson))
router.post('/delivery/mark-delivered', asyncHandler(markAsDelivered))

// === List Filter ===
router.get('/delivery/mealtypes', asyncHandler(getMealTypes))
router.get('/customers', asyncHandler(getCustomersForFilter))

// === Food Count Report ===
router.get('/food-count', (req, res) => {
    res.render('admin/foodReport/list')
})
router.get('/food-count/json', asyncHandler(foodItemCountJson))
router.get('/food-count/mealtypes', getMealTypes)
router.get('/food-count/categories', getCategories)
router.get('/food-count/plans', getPlans)
router.get('/food-count/plans/by-category', asyncHandler(getPlansByCategory))
router.post('/food-count/export', exportFoodItemCount)

// === Food Count Report Detail ===
router.get('/food-count/detail', (req, res) => {
    res.render('admin/foodReport/detail')
})
router.get('/food-count/detail-data', getDetailData)
router.get('/food-count/orders-list', getOrdersList)
router.get('/food-count/customers-list', getCustomersList)
router.post('/food-count/export-orders', exportDetailOrders)

// === Order Report ===
router.get('/report', asyncHandler(orderReportPage))
router.get('/report/json', asyncHandler(orderReportJson))
router.get('/report/customers', asyncHandler(getCustomers))
router.get('/report/categories', asyncHandler(getCategoriesList))
router.get('/report/plans/by-category', asyncHandler(getPlansByCategory))
router.post('/report/export', asyncHandler(exportOrderReport))

export default router
