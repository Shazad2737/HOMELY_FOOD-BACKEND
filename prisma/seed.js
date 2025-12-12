import { AdminRole, MealTypeEnum, PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

// === CONFIGURABLE SEED DATA ===
const SEED_DATA = {
    country: {
        name: 'United Arab Emirates',
        code: 'AE',
        currency: 'AED',
        timezone: 'Asia/Dubai',
    },
    mealTypes: [
        {
            type: MealTypeEnum.BREAKFAST,
            name: 'Breakfast',
            description: 'Morning meal to start your day',
            startTime: '06:00',
            endTime: '10:30',
            sortOrder: 1,
        },
        {
            type: MealTypeEnum.LUNCH,
            name: 'Lunch',
            description: 'Midday meal for energy',
            startTime: '11:00',
            endTime: '15:00',
            sortOrder: 2,
        },
        {
            type: MealTypeEnum.DINNER,
            name: 'Dinner',
            description: 'Evening meal to end your day',
            startTime: '17:00',
            endTime: '22:00',
            sortOrder: 3,
        },
    ],
    locations: [
        {
            name: 'Abu Dhabi',
            code: 'AUH',
            latitude: '24.4539',
            longitude: '54.3773',
        },
        {
            name: 'Dubai',
            code: 'DXB',
            latitude: '25.2048',
            longitude: '55.2708',
        },
        {
            name: 'Sharjah',
            code: 'SHJ',
            latitude: '25.3573',
            longitude: '55.4033',
        },
    ],
    areas: {
        'Abu Dhabi': [
            { name: 'Al Wahda', latitude: '24.4764', longitude: '54.3705' },
            {
                name: 'Al Khalidiyah',
                latitude: '24.4707',
                longitude: '54.3513',
            },
            {
                name: 'Al Reem Island',
                latitude: '24.4987',
                longitude: '54.4085',
            },
        ],
        Dubai: [
            { name: 'Dubai Marina', latitude: '25.0805', longitude: '55.1403' },
            {
                name: 'Downtown Dubai',
                latitude: '25.1972',
                longitude: '55.2744',
            },
            { name: 'Jumeirah', latitude: '25.2295', longitude: '55.2585' },
        ],
        Sharjah: [
            { name: 'Al Majaz', latitude: '25.3213', longitude: '55.3773' },
            { name: 'Al Nahda', latitude: '25.2985', longitude: '55.3685' },
        ],
    },
    brand: {
        name: 'Homely',
        code: 'IMSS001',
        description: 'Premium food delivery service in UAE',
        contactEmail: 'brand@homely.com',
        contactPhone: '+971-84-8423678',
    },
    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@homely.com',
        name: 'Super Administrator',
        password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeThisPassword123!',
    },
}

// === HELPER FUNCTIONS ===
const hashPassword = async (password) => bcrypt.hash(password, 12)

const upsertMany = async (items, callback) => Promise.all(items.map(callback))

// === SEEDING FUNCTIONS ===
async function seedCountry() {
    console.log('🌍 Seeding country...')
    return prisma.country.upsert({
        where: { code: SEED_DATA.country.code },
        update: SEED_DATA.country,
        create: { ...SEED_DATA.country, isActive: true },
    })
}

async function seedLocations(countryId) {
    console.log('📍 Seeding locations...')
    return upsertMany(SEED_DATA.locations, (data) =>
        prisma.location.upsert({
            where: { code: data.code },
            update: { ...data, isActive: true },
            create: { ...data, countryId, isActive: true },
        })
    )
}

async function seedAreas(locations) {
    console.log('🏘️ Seeding areas...')
    const allAreas = Object.entries(SEED_DATA.areas)

    await Promise.all(
        allAreas.map(async ([locationName, areas]) => {
            const location = locations.find((loc) => loc.name === locationName)
            if (!location)
                return console.warn(
                    `⚠️ No matching location for ${locationName}`
                )

            await upsertMany(areas, (a) =>
                prisma.area.upsert({
                    where: {
                        locationId_name: {
                            locationId: location.id,
                            name: a.name,
                        },
                    },
                    update: { ...a, isActive: true },
                    create: { ...a, locationId: location.id, isActive: true },
                })
            )
        })
    )
}

async function seedMealTypes() {
    console.log('🍽️ Seeding meal types...')
    return upsertMany(SEED_DATA.mealTypes, (data) =>
        prisma.mealType.upsert({
            where: { type: data.type },
            update: { ...data, isActive: true },
            create: { ...data, isActive: true },
        })
    )
}

async function seedBrand(countryId) {
    console.log('🏢 Seeding brand...')
    return prisma.brand.upsert({
        where: { countryId_code: { countryId, code: SEED_DATA.brand.code } },
        update: SEED_DATA.brand,
        create: { ...SEED_DATA.brand, countryId, isActive: true },
    })
}

async function seedSuperAdmin(brandId) {
    console.log('👤 Seeding super admin...')
    const hashedPassword = await hashPassword(SEED_DATA.superAdmin.password)

    return prisma.admin.upsert({
        where: { email: SEED_DATA.superAdmin.email },
        update: {
            ...SEED_DATA.superAdmin,
            password: hashedPassword,
            role: AdminRole.SUPER_ADMIN,
            brandId,
            isActive: true,
        },
        create: {
            ...SEED_DATA.superAdmin,
            password: hashedPassword,
            role: AdminRole.SUPER_ADMIN,
            brandId,
            isActive: true,
        },
    })
}

// === MAIN SEED FUNCTION ===
async function main() {
    console.log('\n🚀 Starting database seeding...\n')

    try {
        const country = await seedCountry()
        const locations = await seedLocations(country.id)
        await seedAreas(locations)
        await seedMealTypes()
        const brand = await seedBrand(country.id)
        await seedSuperAdmin(brand.id)

        console.log('\n✨ Database seeding completed successfully!\n')
    } catch (error) {
        console.error('\n❌ Error during seeding:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
