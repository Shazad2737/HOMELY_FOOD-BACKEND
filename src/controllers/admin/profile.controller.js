import { prisma } from '../../../config/database.js'
import bcrypt from 'bcrypt'

export const renderProfilePage = async (req, res) => {
    const adminId = req.session.authAdmin.id

    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
    })

    if (!admin) {
        return res.status(404).render('error', {
            message: 'Profile not found',
        })
    }

    return res.render('admin/profile/profile', {
        title: 'My Profile',
        admin: admin,
    })
}

export const updateProfile = async (req, res) => {
    const { id, name, email } = req.body
    const adminId = req.session.authAdmin.id

    if (id !== adminId) {
        return res.status(403).json({
            success: false,
            error: 'You can only update your own profile',
        })
    }

    const existingAdmin = await prisma.admin.findFirst({
        where: {
            email: email.toLowerCase(),
            id: { not: adminId },
        },
    })

    if (existingAdmin) {
        return res.status(400).json({
            success: false,
            error: 'Email address is already in use',
        })
    }

    await prisma.admin.update({
        where: { id: adminId },
        data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            updatedAt: new Date(),
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    })

    return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
    })
}

export const renderChangePasswordPage = async (req, res) => {
    return res.render('admin/profile/change-password', {
        title: 'Change Password',
    })
}

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const adminId = req.session.authAdmin.id

    if (currentPassword === newPassword) {
        return res.status(400).json({
            success: false,
            error: 'New password must be different from current password',
        })
    }

    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
            id: true,
            email: true,
            password: true,
            isActive: true,
        },
    })

    if (!admin) {
        return res.status(404).json({
            success: false,
            error: 'Admin not found',
        })
    }

    if (!admin.isActive) {
        return res.status(403).json({
            success: false,
            error: 'Your account is inactive. Please contact support.',
        })
    }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        admin.password
    )
    if (!isPasswordValid) {
        return res.status(400).json({
            success: false,
            error: 'Current password is incorrect',
        })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await prisma.admin.update({
        where: { id: adminId },
        data: {
            password: hashedPassword,
            updatedAt: new Date(),
        },
    })

    return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    })
}
