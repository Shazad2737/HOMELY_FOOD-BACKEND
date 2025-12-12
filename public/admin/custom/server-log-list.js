try {
    ;('use strict')

    const logLevelBadge = {
        error: 'danger',
        warn: 'warning',
        info: 'info',
        http: 'primary',
        debug: 'secondary',
    }

    var KTServerLogsDatatable = (function () {
        var dt

        var initDatatable = function () {
            const logType =
                new URLSearchParams(window.location.search).get('type') ||
                'combined'

            dt = $('#server_logs_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[0, 'desc']],
                lengthMenu: [25, 50, 100, 200],
                pageLength: 50,
                language: {
                    emptyTable: 'No log entries found for this log type',
                    zeroRecords: 'No matching log entries found',
                    info: 'Showing _START_ to _END_ of _TOTAL_ log entries',
                    infoEmpty: 'No log entries available',
                    infoFiltered: '(filtered from _MAX_ total entries)',
                },
                ajax: {
                    url: `/admin/logs/server/json`,
                    data: function (d) {
                        d.logType = logType
                        d.level = $('#log_level_filter').val()
                    },
                },
                columns: [
                    { data: 'timestamp', className: 'min-w-150px' },
                    { data: 'level', className: 'min-w-80px' },
                    { data: 'message', className: 'min-w-300px' },
                    { data: null, className: 'text-center min-w-100px' },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: (data) => {
                            if (!data) return '-'
                            const date = new Date(data)
                            return `<span class="text-gray-700 fs-7">${date.toLocaleString()}</span>`
                        },
                    },
                    {
                        targets: 1,
                        render: (data) => {
                            const badgeClass =
                                logLevelBadge[data] || 'secondary'
                            return `<div class="badge badge-light-${badgeClass} fw-bold">${
                                data || 'info'
                            }</div>`
                        },
                    },
                    {
                        targets: 2,
                        render: (data, type, row) => {
                            const message = data || row.message || '-'

                            // Parse HTTP logs for better display
                            if (row.level === 'http') {
                                const httpMatch = message.match(
                                    /^(.*?)\s+"([A-Z]+)\s+(.*?)\s+HTTP/
                                )
                                if (httpMatch) {
                                    const [, ipPart, method, url] = httpMatch
                                    const statusMatch =
                                        message.match(/"\s+(\d{3})\s+/)
                                    const status = statusMatch
                                        ? statusMatch[1]
                                        : ''
                                    const timeMatch =
                                        message.match(/(\d+\.\d+)\s*ms/)
                                    const time = timeMatch ? timeMatch[1] : ''

                                    let statusBadge = 'secondary'
                                    if (status >= 500) statusBadge = 'danger'
                                    else if (status >= 400)
                                        statusBadge = 'warning'
                                    else if (status >= 300) statusBadge = 'info'
                                    else if (status >= 200)
                                        statusBadge = 'success'

                                    return `
                                        <div class="d-flex flex-column">
                                            <div class="mb-1">
                                                <span class="badge badge-light-secondary me-1">${method}</span>
                                                <code class="text-gray-800">${escapeHtml(
                                                    url.length > 60
                                                        ? url.substring(0, 60) +
                                                              '...'
                                                        : url
                                                )}</code>
                                            </div>
                                            <div class="text-muted fs-8">
                                                <span class="badge badge-light-${statusBadge} badge-sm me-1">${status}</span>
                                                ${
                                                    time
                                                        ? `<span class="text-gray-600">${time}ms</span>`
                                                        : ''
                                                }
                                            </div>
                                        </div>
                                    `
                                }
                            }

                            // Regular logs - show more characters
                            const truncated =
                                message.length > 200
                                    ? message.substring(0, 200) + '...'
                                    : message
                            return `<code class="text-gray-800 fs-7">${escapeHtml(
                                truncated
                            )}</code>`
                        },
                    },
                    {
                        targets: 3,
                        render: (data, type, row) => {
                            // Always show view button for HTTP logs (they have long messages)
                            if (row.level === 'http') {
                                return `<button class="btn btn-sm btn-light-primary view-details-btn" 
                                            data-log='${JSON.stringify(
                                                row
                                            ).replace(/'/g, '&#39;')}'>
                                        View Full
                                    </button>`
                            }

                            const hasStack =
                                row.stack && row.stack !== row.message
                            const hasMetadata = Object.keys(row).some(
                                (key) =>
                                    ![
                                        'timestamp',
                                        'level',
                                        'message',
                                        'stack',
                                    ].includes(key)
                            )

                            if (!hasStack && !hasMetadata) {
                                return '<span class="text-muted">-</span>'
                            }

                            return `<button class="btn btn-sm btn-light-primary view-details-btn" 
                                        data-log='${JSON.stringify(row).replace(
                                            /'/g,
                                            '&#39;'
                                        )}'>
                                    View Details
                                </button>`
                        },
                    },
                ],
            })

            // Level filter
            $('#log_level_filter').on('change', () => dt.ajax.reload())
        }

        return {
            init: initDatatable,
        }
    })()

    KTUtil.onDOMContentLoaded(() => KTServerLogsDatatable.init())

    // View details modal
    $('#server_logs_table').on('click', '.view-details-btn', function (e) {
        e.preventDefault()
        const logData = JSON.parse($(this).attr('data-log'))

        let html = '<div class="p-5">'

        // Timestamp
        if (logData.timestamp) {
            html += `<div class="mb-4">
                <strong class="text-gray-700">Timestamp:</strong>
                <div class="mt-1 text-gray-600">${new Date(
                    logData.timestamp
                ).toLocaleString()}</div>
            </div>`
        }

        // Level
        if (logData.level) {
            const badgeClass = logLevelBadge[logData.level] || 'secondary'
            html += `<div class="mb-4">
                <strong class="text-gray-700">Level:</strong>
                <div class="mt-1"><span class="badge badge-light-${badgeClass}">${logData.level}</span></div>
            </div>`
        }

        // Message - Parse HTTP logs for better display
        if (logData.message) {
            if (logData.level === 'http') {
                // Parse HTTP log format
                const httpMatch = logData.message.match(
                    /^(.*?)\s+"([A-Z]+)\s+(.*?)\s+HTTP\/([\d.]+)"\s+(\d{3})\s+(\S+)\s+"([^"]*)"\s+"([^"]*)"\s+-\s+([\d.]+)\s*ms/
                )

                if (httpMatch) {
                    const [
                        ,
                        ip,
                        method,
                        url,
                        httpVersion,
                        status,
                        size,
                        referrer,
                        userAgent,
                        responseTime,
                    ] = httpMatch

                    let statusBadge = 'secondary'
                    if (status >= 500) statusBadge = 'danger'
                    else if (status >= 400) statusBadge = 'warning'
                    else if (status >= 300) statusBadge = 'info'
                    else if (status >= 200) statusBadge = 'success'

                    html += `<div class="mb-4">
                        <strong class="text-gray-700">HTTP Request Details:</strong>
                        <div class="mt-2 p-4 bg-light rounded">
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">Method:</div>
                                <div class="col-9"><span class="badge badge-light-secondary">${method}</span></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">URL:</div>
                                <div class="col-9"><code>${escapeHtml(
                                    url
                                )}</code></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">Status:</div>
                                <div class="col-9"><span class="badge badge-light-${statusBadge}">${status}</span></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">Response Time:</div>
                                <div class="col-9"><span class="text-gray-700">${responseTime} ms</span></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">Size:</div>
                                <div class="col-9"><span class="text-gray-700">${
                                    size === '-' ? 'N/A' : size + ' bytes'
                                }</span></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">IP Address:</div>
                                <div class="col-9"><code>${escapeHtml(
                                    ip
                                )}</code></div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">HTTP Version:</div>
                                <div class="col-9"><span class="text-gray-700">${httpVersion}</span></div>
                            </div>
                            ${
                                referrer && referrer !== '-'
                                    ? `
                            <div class="row mb-2">
                                <div class="col-3 fw-bold">Referrer:</div>
                                <div class="col-9"><code class="fs-8">${escapeHtml(
                                    referrer
                                )}</code></div>
                            </div>`
                                    : ''
                            }
                            ${
                                userAgent && userAgent !== '-'
                                    ? `
                            <div class="row">
                                <div class="col-3 fw-bold">User Agent:</div>
                                <div class="col-9"><code class="fs-8">${escapeHtml(
                                    userAgent
                                )}</code></div>
                            </div>`
                                    : ''
                            }
                        </div>
                    </div>`
                } else {
                    // Fallback for unparseable HTTP logs
                    html += `<div class="mb-4">
                        <strong class="text-gray-700">Message:</strong>
                        <pre class="mt-1 p-3 bg-light rounded" style="max-height: 300px; overflow-y: auto;"><code>${escapeHtml(
                            logData.message
                        )}</code></pre>
                    </div>`
                }
            } else {
                // Regular log message
                html += `<div class="mb-4">
                    <strong class="text-gray-700">Message:</strong>
                    <pre class="mt-1 p-3 bg-light rounded"><code>${escapeHtml(
                        logData.message
                    )}</code></pre>
                </div>`
            }
        }

        // Stack trace
        if (logData.stack && logData.stack !== logData.message) {
            html += `<div class="mb-4">
                <strong class="text-gray-700">Stack Trace:</strong>
                <pre class="mt-1 p-3 bg-light rounded" style="max-height: 300px; overflow-y: auto;"><code>${escapeHtml(
                    logData.stack
                )}</code></pre>
            </div>`
        }

        // Additional metadata
        const metaKeys = Object.keys(logData).filter(
            (key) => !['timestamp', 'level', 'message', 'stack'].includes(key)
        )
        if (metaKeys.length > 0) {
            html += `<div class="mb-4">
                <strong class="text-gray-700">Additional Data:</strong>
                <pre class="mt-1 p-3 bg-light rounded" style="max-height: 200px; overflow-y: auto;"><code>${escapeHtml(
                    JSON.stringify(
                        metaKeys.reduce(
                            (obj, key) => ({ ...obj, [key]: logData[key] }),
                            {}
                        ),
                        null,
                        2
                    )
                )}</code></pre>
            </div>`
        }

        html += '</div>'

        $('#log_details_content').html(html)
        $('#log_details_modal').modal('show')
    })

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        }
        return String(text).replace(/[&<>"']/g, (m) => map[m])
    }
} catch (error) {
    console.error('Server logs error:', error)
}
