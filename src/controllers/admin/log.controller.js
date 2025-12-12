import path from 'path'
import fs from 'fs/promises'
import { format } from 'date-fns'
import logger from '../../utils/logger.js'

export const serverLogList = async (req, res) => {
    try {
        const validTypes = [
            'combined',
            'error',
            'http',
            'exceptions',
            'rejections',
        ]
        const activeType = validTypes.includes(req.query.type)
            ? req.query.type
            : 'combined'

        return res.render('admin/admin-logs/server-log-list', {
            validTypes,
            activeType,
        })
    } catch (error) {
        logger.error(error)
        return res.render('admin/error-500')
    }
}

export const serverLogJson = async (req, res) => {
    try {
        const logType = req.query.logType || 'combined'
        const draw = parseInt(req.query.draw) || 1
        const start = parseInt(req.query.start) || 0
        const length = parseInt(req.query.length) || 50
        const searchValue = req.query.search?.value || ''
        const levelFilter = req.query.level || ''

        // Read log file
        const logs = await readLogFile(logType)

        // Filter logs
        let filteredLogs = logs
        if (searchValue) {
            filteredLogs = logs.filter((log) =>
                JSON.stringify(log)
                    .toLowerCase()
                    .includes(searchValue.toLowerCase())
            )
        }
        if (levelFilter) {
            filteredLogs = filteredLogs.filter(
                (log) => log.level === levelFilter
            )
        }

        // Pagination
        const paginatedLogs = filteredLogs.slice(start, start + length)

        return res.json({
            draw,
            recordsTotal: logs.length,
            recordsFiltered: filteredLogs.length,
            data: paginatedLogs,
        })
    } catch (error) {
        logger.error(error)
        return res.json({
            draw: parseInt(req.query.draw) || 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
            error: error.message,
        })
    }
}

async function readLogFile(logType) {
    try {
        const today = format(new Date(), 'yyyy-MM-dd')
        let logFilePath

        // Determine log file path based on type
        if (logType === 'combined' || logType === 'http') {
            // Try dated file first
            logFilePath = path.join(
                process.cwd(),
                `logs/${logType}-${today}.log`
            )
            try {
                await fs.access(logFilePath)
            } catch {
                // Fallback to non-dated file
                logFilePath = path.join(process.cwd(), `logs/${logType}.log`)
            }
        } else {
            // error, exceptions, rejections use simple names
            logFilePath = path.join(process.cwd(), `logs/${logType}.log`)
        }

        // Check if file exists
        try {
            await fs.access(logFilePath)
        } catch {
            logger.warn(`Log file not found: ${logFilePath}`)
            return []
        }

        const data = await fs.readFile(logFilePath, 'utf8')
        const logs = data
            .split('\n')
            .filter((line) => line.trim())
            .filter((line) => line !== 'undefined') // Filter out "undefined" entries
            .map((line) => {
                try {
                    const parsed = JSON.parse(line)
                    // Ensure required fields exist
                    return {
                        timestamp: parsed.timestamp || new Date().toISOString(),
                        level: parsed.level || logType,
                        message: parsed.message || 'No message',
                        ...parsed,
                    }
                } catch {
                    // Handle non-JSON lines
                    return {
                        message: line,
                        timestamp: new Date().toISOString(),
                        level: logType === 'error' ? 'error' : 'info',
                    }
                }
            })
            .reverse()

        return logs
    } catch (error) {
        logger.error(`Error reading log file: ${error.message}`)
        return []
    }
}
