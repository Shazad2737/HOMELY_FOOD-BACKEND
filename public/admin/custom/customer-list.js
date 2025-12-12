try {
    ;('use strict')

    let customerStatusBadge = {
        ACTIVE: 'success',
        INACTIVE: 'warning',
        SUSPENDED: 'danger',
    }

    var KTDatatablesServerSide = (function () {
        var table
        var dt

        var initDatatable = function () {
            dt = $('#customer_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[6, 'desc']], // Sort by created date
                orderable: false,
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: {
                    url: `/admin/customer/json`,
                    data: function (d) {
                        d.status = $('#customer_status_filter').val()
                        d.isVerified = $('#customer_verified_filter').val()
                    },
                },
                columns: [
                    {
                        data: 'name',
                        className: 'min-w-150px',
                    },
                    {
                        data: 'customerCode',
                        className: 'min-w-120px',
                    },
                    {
                        data: 'isVerified',
                        className: 'min-w-80px',
                    },
                    {
                        data: 'createdAt',
                        className: 'min-w-100px',
                    },
                    {
                        data: '_count.orders',
                        className: 'min-w-80px',
                    },
                    {
                        data: 'status',
                        className: 'min-w-100px',
                    },
                    {
                        data: null,
                        className: 'text-center min-w-100px',
                    },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: function (data, type, row) {
                            const profileUrl =
                                row.profileUrl || '/admin/media/blank.png'

                            return `
                                <div class="d-flex align-items-center">
                                    <div class="symbol symbol-circle symbol-50px overflow-hidden me-3">
                                        <div class="symbol-label">
                                            <img 
                                                src="${profileUrl}" 
                                                alt="${row.name}" 
                                                class="w-100"
                                                onerror="this.onerror=null; this.src='/admin/assets/media/avatars/blank.png';"
                                            >
                                        </div>
                                    </div>
                                    <div class="d-flex flex-column">
                                        <a href="/admin/customer/view/${
                                            row.id
                                        }" 
                                        class="text-gray-800 text-hover-primary fw-bold mb-1">
                                            ${row.name}
                                        </a>
                                        <span class="text-muted fs-7">${
                                            row.mobile || ''
                                        }</span>
                                    </div>
                                </div>`
                        },
                    },
                    {
                        targets: 1,
                        render: function (data, type, row) {
                            return `<span class="fw-semibold">${row.customerCode}</span>`
                        },
                    },
                    {
                        targets: 2,
                        render: function (data, type, row) {
                            if (row.isVerified) {
                                return `<span class="badge badge-light-success">
                                    <i class="ki-outline ki-check-circle fs-6 me-1"></i>Verified
                                </span>`
                            }
                            return `<span class="badge badge-light-warning">
                                <i class="ki-outline ki-cross-circle fs-6 me-1"></i>Not Verified
                            </span>`
                        },
                    },
                    {
                        targets: 3,
                        render: function (data, type, row) {
                            const joinDate = new Date(
                                row.createdAt
                            ).toLocaleDateString()
                            const updatedDate = new Date(
                                row.updatedAt
                            ).toLocaleDateString()

                            return `<div class="d-flex flex-column">
                                <span class="fw-bold">${joinDate}</span>
                                <span class="text-muted fs-7">Updated: ${updatedDate}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 4,
                        render: function (data, type, row) {
                            const orderCount = row._count?.orders || 0
                            return `<span class="badge badge-light-info">${orderCount}</span>`
                        },
                    },
                    {
                        targets: 5,
                        render: function (data, type, row) {
                            let badgeClass =
                                customerStatusBadge[data] || 'secondary'
                            let statusText = data || 'Unknown'
                            return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-center p-2">
                                <span class="fw-semibold fs-7">${statusText}</span>
                            </div>`
                        },
                    },
                    {
                        targets: 6,
                        data: null,
                        className: 'text-center',
                        render: function (data, type, row) {
                            return `
                                <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary" 
                                    data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                    Actions 
                                    <i class="ki-outline ki-down fs-5 ms-1"></i>
                                </a>
                                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4" data-kt-menu="true">
                                    <div class="menu-item px-3">
                                        <a href="/admin/customer/view/${
                                            row.id
                                        }" class="menu-link px-3">
                                            <i class="ki-outline ki-eye fs-6 me-2"></i>View Details
                                        </a>
                                    </div>
                                    ${
                                        row.status === 'ACTIVE'
                                            ? `
                                            <div class="menu-item px-3">
                                                <a href="#" class="menu-link px-3 text-warning" data-customer-id="${row.id}" data-action="suspend">
                                                    <i class="ki-outline ki-shield-cross fs-6 me-2"></i>Suspend
                                                </a>
                                            </div>`
                                            : ''
                                    }
                                    ${
                                        ['SUSPENDED', 'INACTIVE'].includes(
                                            row.status
                                        )
                                            ? `
                                            <div class="menu-item px-3">
                                                <a href="#" class="menu-link px-3 text-success" data-customer-id="${row.id}" data-action="activate">
                                                    <i class="ki-outline ki-shield-tick fs-6 me-2"></i>Activate
                                                </a>
                                            </div>`
                                            : ''
                                    }

                                </div>
                            `
                        },
                    },
                ],
            })

            table = dt.$

            // Search functionality
            let searchInput = document.querySelector('#customer_search')
            if (searchInput) {
                searchInput.addEventListener('keyup', function () {
                    dt.search(this.value).draw()
                })
            }

            // Status filter
            let statusSelect = document.querySelector('#customer_status_filter')
            if (statusSelect) {
                $(statusSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Verification filter
            let verifiedSelect = document.querySelector(
                '#customer_verified_filter'
            )
            if (verifiedSelect) {
                $(verifiedSelect).on('change', function () {
                    dt.ajax.reload()
                })
            }

            // Unified handler for customer status updates
            $('#customer_table').on('click', '[data-action]', function (e) {
                e.preventDefault()

                const $this = $(this)
                const customerId = $this.data('customer-id')
                const action = $this.data('action')

                // Define action-based settings
                const actions = {
                    activate: {
                        status: 'ACTIVE',
                        title: 'Activate Customer',
                        text: 'Are you sure you want to activate this customer?',
                        confirmText: 'Yes, Activate',
                        successMsg: 'Customer activated successfully!',
                        icon: 'success',
                    },
                    suspend: {
                        status: 'SUSPENDED',
                        title: 'Suspend Customer',
                        text: 'Are you sure you want to suspend this customer?',
                        confirmText: 'Yes, Suspend',
                        successMsg: 'Customer suspended successfully!',
                        icon: 'warning',
                    },
                }

                const current = actions[action]
                if (!current) return

                // Confirmation popup using SweetAlert2
                Swal.fire({
                    title: current.title,
                    text: current.text,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: current.confirmText,
                    cancelButtonText: 'Cancel',
                    reverseButtons: true,
                    customClass: {
                        confirmButton: `btn btn-${
                            action === 'activate' ? 'success' : 'warning'
                        }`,
                        cancelButton: 'btn btn-secondary',
                    },
                    buttonsStyling: false,
                }).then((result) => {
                    if (!result.isConfirmed) return

                    fetch(`/admin/customer/status/${customerId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: current.status }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.success) {
                                Swal.fire({
                                    icon: current.icon,
                                    title: 'Success!',
                                    text: current.successMsg,
                                    timer: 2000,
                                    showConfirmButton: false,
                                })
                                dt.ajax.reload()
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Failed!',
                                    text:
                                        data.message ||
                                        `Failed to ${action} customer.`,
                                })
                            }
                        })
                        .catch((err) => {
                            console.error(err)
                            Swal.fire({
                                icon: 'error',
                                title: 'Error!',
                                text: 'An unexpected error occurred.',
                            })
                        })
                })
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
