import { PrismaClient } from '@prisma/client'
import logger from '../../utils/logger.js'
import axios from 'axios'

const prisma = new PrismaClient()

export const exportDishItemData = async (req, res) => {
    try {
        // Fetch categories with their related data
        const categories = await prisma.category.findMany({
            include: {
                CategoryLocation: {
                    include: {
                        location: true,
                        area: true,
                    },
                },
            },
        })
        // Fetch plans with their category info
        const plans = await prisma.plan.findMany({
            include: {
                category: {
                    select: {
                        name: true,
                        brandId: true,
                    },
                },
                FoodItemPlan: true,
            },
        })

        // Fetch food items with all related data
        const foodItems = await prisma.foodItem.findMany({
            include: {
                mealType: true,
                category: {
                    select: {
                        name: true,
                        brandId: true,
                    },
                },
                deliverWith: true,
                availableDays: true,
                locations: {
                    include: {
                        location: true,
                        area: true,
                    },
                },
                planAvailability: {
                    include: {
                        plan: {
                            select: {
                                type: true,
                            },
                        },
                    },
                },
            },
        })

        // Create export object
        const exportData = {
            exportDate: new Date().toISOString(),
            categories: categories.map((cat) => ({
                name: cat.name,
                description: cat.description,
                imageUrl: cat.imageUrl,
                isActive: cat.isActive,
                sortOrder: cat.sortOrder,
                locations: cat.CategoryLocation.map((cl) => ({
                    locationCode: cl.location?.code,
                    areaName: cl.area.name,
                })),
            })),
            plans: plans.map((plan) => ({
                name: plan.name,
                type: plan.type,
                categoryName: plan.category.name,
                description: plan.description,
                imageUrl: plan.imageUrl,
                isActive: plan.isActive,
                isUnlimited: plan.isUnlimited,
                sortOrder: plan.sortOrder,
                foodItemCount: plan.FoodItemPlan.length,
            })),
            foodItems: foodItems.map((item) => ({
                name: item.name,
                code: item.code,
                description: item.description,
                imageUrl: item.imageUrl,
                cuisine: item.cuisine,
                style: item.style,
                price: item.price?.toString(),
                isActive: item.isActive,
                isVegetarian: item.isVegetarian,
                isVegan: item.isVegan,
                mealType: item.mealType.type,
                categoryName: item.category.name,
                deliveryMode: item.deliveryMode,
                deliverWith: item.deliverWith?.type,
                availableDays: item.availableDays.map((d) => d.dayOfWeek),
                locations: item.locations.map((loc) => ({
                    locationCode: loc.location?.code,
                    areaName: loc.area.name,
                })),
                planTypes: item.planAvailability.map((p) => p.plan.type),
            })),
        }
        return res.status(200).json(exportData)
    } catch (error) {
        logger.error(error)
        return res.status(500).json({ message: error.message })
    }
}

export const sendTestMessage = async (req, res) => {
    try {
        let mobileNumber = req.body.mobile
        let message = encodeURIComponent(req.body.message)
        if (!mobileNumber || !message) {
            return res
                .status(400)
                .json({ message: 'Mobile number and message are required' })
        }

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.smscountry.com/SMSCwebservice_bulk.aspx?User=Nabee37618&passwd=eatRoot@2024&mobilenumber=${mobileNumber}&message=${message}&sid=EATROOT&mtype=N&DR=y`,
            headers: {
                Cookie: 'ASP.NET_SessionId=vs0vckrbdd4ujzmgogfemqmi',
            },
        }

        axios
            .request(config)
            .then((response) => {
                console.log(JSON.stringify(response.data))
                logger.info(JSON.stringify(response.data))
                return res
                    .status(200)
                    .json({ message: 'Message sent successfully' })
            })
            .catch((error) => {
                console.log(error)
                logger.error(error)
                return res.status(500).json({ message: error.message })
            })
    } catch (error) {
        logger.error(error)
        return res.status(500).json({ message: error.message })
    }
}
