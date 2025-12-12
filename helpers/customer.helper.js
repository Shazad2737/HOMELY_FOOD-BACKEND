// import { prisma } from '../config/database.js'

export const generateCustomerCode = async (prisma, options = {}) => {
    let { prefix = '', startingSequence = 1 } = options

    startingSequence = Number(startingSequence)
    if (isNaN(startingSequence)) {
        console.warn(
            `⚠️ Invalid startingSequence "${options.startingSequence}" — defaulting to 1`
        )
        startingSequence = 1
    }

    const lastCustomer = await prisma.customer.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { customerCode: true },
    })

    let nextNumber = startingSequence

    if (lastCustomer?.customerCode) {
        const match = lastCustomer.customerCode.match(/\d+$/)
        if (match) {
            nextNumber = parseInt(match[0], 10) + 1
        }
    }

    const numberPart = String(nextNumber).padStart(4, '0')

    const customerCode = prefix ? `${prefix}${numberPart}` : numberPart

    return customerCode
}
