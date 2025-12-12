import { prisma } from '../../../config/database.js'
import bcrypt from 'bcrypt'

export const login = async (req, res) => {
    res.render(`admin/auth/login`)
}

export const loginSubmit = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: 'Email and password are required' })
    }

    const admin = await prisma.admin.findUnique({
        where: { email },
        include: {
            brand: {
                select: {
                    id: true,
                    name: true,
                    country: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            currency: true,
                            timezone: true,
                            isActive: true,
                        },
                    },
                    isActive: true,
                },
            },
        },
    })

    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' })
    }

    if (!admin.isActive) {
        return res.status(403).json({ message: 'Admin account is inactive' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (admin.brandId && (!admin.brand || !admin.brand.isActive)) {
        return res
            .status(403)
            .json({ message: 'Associated brand is inactive or not found' })
    }

    req.session.authAdmin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
    }

    if (admin.brand) {
        req.session.brandId = admin.brand.id
        req.session.country = admin.brand.country
    }

    // Set locationId if applicable
    // if (admin.locationId) {
    //   req.session.locationId = admin.locationId;
    // }

    return res.status(200).json({
        message: 'Login successful',
        data: {
            role: admin.role,
            brandId: admin.brandId,
            locationId: admin.locationId,
        },
    })
}

export const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' })
        }
        res.clearCookie('connect.sid')
        res.redirect('/admin/auth/login/')
    })
}
