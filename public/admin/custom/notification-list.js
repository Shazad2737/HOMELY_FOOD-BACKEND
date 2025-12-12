try {
    ;('use strict')

    let notificationTypeBadge = {
        GENERAL: 'primary',
        ALERT: 'danger',
        PROMOTION: 'success',
        ANNOUNCEMENT: 'info',
        SYSTEM: 'warning',
    }

    let notificationTypeIcons = {
        GENERAL:
            '<i class="ki-outline ki-notification-bing text-primary fs-5 me-2"></i>',
        ALERT: '<i class="ki-outline ki-information text-danger fs-5 me-2"></i>',
        PROMOTION:
            '<i class="ki-outline ki-discount text-success fs-5 me-2"></i>',
        ANNOUNCEMENT:
            '<i class="ki-outline ki-megaphone text-info fs-5 me-2"></i>',
        SYSTEM: '<i class="ki-outline ki-setting-2 text-warning fs-5 me-2"></i>',
    }

    var KTDatatablesServerSide = (function () {
        var table
        var dt

        var initDatatable = function () {
            dt = $('#notification_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[3, 'desc']],
                orderable: false,
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: {
                    url: `/admin/notification/json`,
                    data: function (d) {
                        d.type = $('#notification_type_filter').val()
                        d.status = $('#notification_status_filter').val()
                    },
                },
                columns: [
                    {
                        data: 'caption',
                        className: 'min-w-250px',
                    },
                    {
                        data: 'type',
                        className: 'min-w-100px',
                    },
                    {
                        data: 'sentAt',
                        className: 'min-w-100px',
                    },
                    // {
                    //     data: 'createdAt',
                    //     className: 'min-w-140px',
                    // },
                    {
                        data: 'sentAt',
                        className: 'min-w-140px',
                    },
                    // {
                    //     data: null,
                    //     className: 'text-center min-w-100px',
                    // },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            const hasImage = row.imageUrl ? true : false
                            const imageHtml = hasImage
                                ? `<div class="symbol symbol-50px me-3">
                                    <img src="${row.imageUrl}" alt="" class="w-100 rounded"/>
                                </div>`
                                : ''

                            const description = row.description
                                ? `<span class="text-muted fs-7 d-block mt-1">${
                                      row.description.length > 80
                                          ? row.description.substring(0, 80) +
                                            '...'
                                          : row.description
                                  }</span>`
                                : ''

                            return `<div class="d-flex align-items-center">
                                ${imageHtml}
                                <div class="d-flex flex-column">
                                <span class="text-gray-800 fw-bold mb-1">${row.caption}</span>
                                    ${description}
                                </div>
                            </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            let badgeClass =
                                notificationTypeBadge[data] || 'secondary'
                            let icon = notificationTypeIcons[data] || ''
                            return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-center p-2">
                                ${icon}
                                <span class="fw-semibold fs-7">${data}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            if (row.sentAt) {
                                return `<div class="badge badge-light-success d-inline-flex align-items-center p-2">
                                    <i class="ki-outline ki-check-circle text-success fs-5 me-2"></i>
                                    <span class="fw-semibold fs-7">Sent</span>
                                </div>`
                            } else {
                                return `<div class="badge badge-light-warning d-inline-flex align-items-center p-2">
                                    <i class="ki-outline ki-time text-warning fs-5 me-2"></i>
                                    <span class="fw-semibold fs-7">Draft</span>
                                </div>`
                            }
                        },
                    },
                    // {
                    //     targets: 3,
                    //     render: function (data, type, row) {
                    //         const date = new Date(row.createdAt)
                    //         const formattedDate = date.toLocaleDateString(
                    //             'en-US',
                    //             {
                    //                 year: 'numeric',
                    //                 month: 'short',
                    //                 day: 'numeric',
                    //             }
                    //         )
                    //         const formattedTime = date.toLocaleTimeString(
                    //             'en-US',
                    //             {
                    //                 hour: '2-digit',
                    //                 minute: '2-digit',
                    //             }
                    //         )

                    //         return `<div class="d-flex flex-column">
                    //             <span class="text-gray-800 fw-bold">${formattedDate}</span>
                    //             <span class="text-muted fs-7">${formattedTime}</span>
                    //         </div>`
                    //     },
                    // },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            if (!row.sentAt) {
                                return '<span class="text-muted">-</span>'
                            }

                            const date = new Date(row.sentAt)
                            const formattedDate = date.toLocaleDateString(
                                'en-US',
                                {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                }
                            )
                            const formattedTime = date.toLocaleTimeString(
                                'en-US',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }
                            )

                            // Calculate time ago
                            const now = new Date()
                            const diffInSeconds = Math.floor(
                                (now - date) / 1000
                            )
                            let timeAgo = ''

                            if (diffInSeconds < 60) {
                                timeAgo = `${diffInSeconds}s ago`
                            } else if (diffInSeconds < 3600) {
                                timeAgo = `${Math.floor(
                                    diffInSeconds / 60
                                )}min ago`
                            } else if (diffInSeconds < 86400) {
                                timeAgo = `${Math.floor(
                                    diffInSeconds / 3600
                                )}h ago`
                            } else if (diffInSeconds < 604800) {
                                timeAgo = `${Math.floor(
                                    diffInSeconds / 86400
                                )}d ago`
                            } else {
                                timeAgo = `${Math.floor(
                                    diffInSeconds / 604800
                                )}w ago`
                            }

                            return `<div class="d-flex flex-column">
                                <span class="text-gray-800 fw-bold">${row.sentAtDate}</span>
                                <span class="text-muted fs-7">${row.sentAtTime}</span>
                                <div class="badge badge-light-info fs-8 mt-1">${timeAgo}</div>
                            </div>`
                        },
                    },
                    // {
                    //     targets: 4,
                    //     data: null,
                    //     className: 'text-center',
                    //     render: function (data, type, row) {
                    //         const sendButton = !row.sentAt
                    //             ? `<div class="menu-item px-3">
                    //                 <a class="menu-link px-3" onclick="sendNotification('${row.id}')">
                    //                     <i class="ki-outline ki-send fs-6 me-2"></i>Send Now
                    //                 </a>
                    //             </div>`
                    //             : ''

                    //         return `
                    //             <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
                    //                 data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                    //                 Actions
                    //                 <i class="ki-outline ki-down fs-5 ms-1"></i>
                    //             </a>
                    //             <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4" data-kt-menu="true">
                    //                 <div class="menu-item px-3">
                    //                     <a href="/admin/notifications/edit/${row.id}" class="menu-link px-3">
                    //                         <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                    //                     </a>
                    //                 </div>
                    //                 ${sendButton}
                    //                 <div class="menu-item px-3">
                    //                     <a class="menu-link px-3 text-danger" onclick="deleteNotification('${row.id}')">
                    //                         <i class="ki-outline ki-trash fs-6 me-2"></i>Delete
                    //                     </a>
                    //                 </div>
                    //             </div>
                    //         `
                    //     },
                    // },
                ],
            })

            table = dt.$

            // Type filter
            let typeSelect = document.querySelector('#notification_type_filter')
            if (typeSelect) {
                $(typeSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Status filter
            let statusSelect = document.querySelector(
                '#notification_status_filter'
            )
            if (statusSelect) {
                $(statusSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Clear filters
            $('#clear_filters_btn').on('click', function () {
                $('#notification_type_filter').val('').trigger('change')
                $('#notification_status_filter').val('').trigger('change')
                dt.ajax.reload()
            })

            dt.on('draw', function (e) {
                if (window.KTMenu) KTMenu.createInstances()
            })
        }

        return {
            init: function () {
                initDatatable()
            },
        }
    })()

    KTUtil.onDOMContentLoaded(function () {
        KTDatatablesServerSide.init()
    })
} catch (error) {
    console.log('ERR', error)
}
