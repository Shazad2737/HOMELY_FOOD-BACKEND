import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { addDays as addDaysFn } from 'date-fns'
import { envConfig } from '../../config/env.js'

const DEFAULT_TIMEZONE = envConfig.general.DEFAULT_TIMEZONE

const DAY_NAMES = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
]

// --- Get day of week ---
export const getDayOfWeek = (date, timezone = DEFAULT_TIMEZONE) => {
    const zonedDate = toZonedTime(date, timezone)
    const dayIndex = zonedDate.getDay()
    const dayName = DAY_NAMES[dayIndex]

    return dayName
}

// --- From ISO string ---
export const getDayOfWeekFromISO = (isoString, timezone = DEFAULT_TIMEZONE) =>
    getDayOfWeek(new Date(isoString), timezone)

// --- Is Today ---
export const isToday = (date, timezone = DEFAULT_TIMEZONE) => {
    const d1 = formatInTimeZone(date, timezone, 'yyyy-MM-dd')
    const d2 = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
    return d1 === d2
}

// --- Is Past Date ---
export const isPastDate = (date, timezone = DEFAULT_TIMEZONE) => {
    const d1 = formatInTimeZone(date, timezone, 'yyyy-MM-dd')
    const d2 = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
    return d1 < d2
}

// --- Start of Day ---
export const getStartOfDay = (date, timezone = DEFAULT_TIMEZONE) => {
    const localMidnight =
        formatInTimeZone(date, timezone, 'yyyy-MM-dd') + 'T00:00:00'
    return toZonedTime(localMidnight, timezone)
}

// --- Add Days ---
export const addDays = (date, days, timezone = DEFAULT_TIMEZONE) => {
    const local = fromZonedTime(date, timezone)
    const newLocal = addDaysFn(local, days)
    return toZonedTime(newLocal, timezone)
}

// --- Format Date ---
export const formatDateOnly = (date, timezone = DEFAULT_TIMEZONE) =>
    formatInTimeZone(date, timezone, 'yyyy-MM-dd')

// --- Format Date With Time ---
export const formatDateTime = (date, timezone = DEFAULT_TIMEZONE) =>
    formatInTimeZone(new Date(date), timezone, 'yyyy-MM-dd HH:mm')

// --- Current Time ---
export const getCurrentTimeInTimezone = (timezone = DEFAULT_TIMEZONE) =>
    fromZonedTime(new Date(), timezone)

// --- Hour in Timezone ---
export const getHourInTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
    return parseInt(formatInTimeZone(date, timezone, 'H'), 10)
}

// --- Time ago ---
export const getTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
}

// --- Day Category ---
export const getDayCategory = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)

    now.setHours(0, 0, 0, 0)
    notificationDate.setHours(0, 0, 0, 0)

    const diffTime = now - notificationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays <= 7) return 'this_week'
    if (diffDays <= 30) return 'this_month'
    return 'older'
}
