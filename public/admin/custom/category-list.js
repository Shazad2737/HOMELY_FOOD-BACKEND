try {
    ;('use strict')

    const categoryStatusBadge = {
        true: 'success',
        false: 'danger',
    }

    const KTDatatablesServerSide = (() => {
        let dt

        const initDatatable = () => {
            dt = $('#category_table').DataTable({
                searchDelay: 500,
                processing: true,
                serverSide: true,
                order: [[3, 'desc']],
                lengthMenu: [25, 50, 75, 100],
                pageLength: 50,
                ajax: { url: `/admin/category/json`, type: 'GET' },
                columns: [
                    {
                        data: 'imageUrl',
                        className: 'text-center min-w-100px',
                        orderable: false,
                    },
                    { data: 'name', className: 'min-w-150px' },
                    // { data: 'description', className: 'min-w-200px' },
                    {
                        data: '_count.CategoryLocation',
                        className: 'text-center min-w-100px',
                        orderable: false,
                    },
                    // { data: 'AreaCategory', className: 'min-w-150px' },
                    { data: 'isActive', className: 'text-center min-w-70px' },
                    {
                        data: '_count.plans',
                        className: 'text-center min-w-70px',
                        orderable: false,
                    },
                    {
                        data: null,
                        className: 'text-center min-w-100px',
                        orderable: false,
                    },
                ],
                columnDefs: [
                    {
                        targets: 0,
                        render: (data, type, row) => `
                            <div class="symbol symbol-50px me-2">
                                <img src="${
                                    row.imageUrl ||
                                    '/admin/assets/media/avatars/blank.png'
                                }"
                                     alt="${row.name || ''}" class="rounded"/>
                            </div>`,
                    },
                    {
                        targets: 1,
                        render: (data, type, row) => `
                            <div class="d-flex flex-column">
                                <a href="/admin/category/edit/${row.id}"
                                   class="text-gray-800 text-hover-primary fw-bold mb-1">
                                   ${row.name || ''}
                                </a>
                                <span class="text-muted fs-7">Sort: ${
                                    row.sortOrder ?? 0
                                }</span>
                            </div>`,
                    },
                    // {
                    //     targets: 2,
                    //     render: (data) =>
                    //         `<span class="text-gray-600">${data || '-'}</span>`,
                    // },
                    {
                        targets: 2,
                        render: (data, type, row) => {
                            const count = row._count?.CategoryLocation || 0
                            return count === 0
                                ? '<span class="badge badge-light-secondary">0 Locations</span>'
                                : `<span class="badge badge-light-primary">${count} Location${
                                      count > 1 ? 's' : ''
                                  }</span>`
                        },
                    },
                    // {
                    //     targets: 4,
                    //     render: (data) => {
                    //         if (!data || data.length === 0)
                    //             return '<span class="text-muted">No areas</span>'
                    //         const areas = data
                    //             .map((ac) => ac.area?.name)
                    //             .filter(Boolean)
                    //         if (areas.length === 0)
                    //             return '<span class="text-muted">No areas</span>'
                    //         let display = areas.slice(0, 2).join(', ')
                    //         if (areas.length > 2)
                    //             display += ` <span class="badge badge-light-primary">+${
                    //                 areas.length - 2
                    //             }</span>`
                    //         return `<span class="text-gray-700">${display}</span>`
                    //     },
                    // },
                    {
                        targets: 3,
                        render: (data) => {
                            const badgeClass =
                                categoryStatusBadge[data] || 'secondary'
                            const statusText = data ? 'Active' : 'Inactive'
                            return `<div class="badge badge-light-${badgeClass} p-2 fw-semibold">${statusText}</div>`
                        },
                    },
                    {
                        targets: 4,
                        render: (data, type, row) => `
                            <span class="badge badge-light-info">${
                                row._count?.plans || 0
                            } Plans</span>`,
                    },
                    {
                        targets: 5,
                        render: (data, type, row) => `
                            <a href="#" 
                               class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
                               data-kt-menu-trigger="click" 
                               data-kt-menu-placement="bottom-end">
                               Actions
                               <i class="ki-outline ki-down fs-5 ms-1"></i>
                            </a>
                            <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 
                                        menu-state-bg-light-primary fw-semibold fs-7 w-150px py-4" data-kt-menu="true">
                                <div class="menu-item px-3">
                                    <a href="/admin/category/edit/${
                                        row.id
                                    }" class="menu-link px-3">
                                        <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                                    </a>
                                </div>
                                <div class="menu-item px-3">
                                    <a href="#" class="menu-link px-3 toggle-status-btn" data-id="${
                                        row.id
                                    }" 
                                        data-active="${row.isActive}">
                                        <i class="ki-outline ki-toggle-${
                                            row.isActive ? 'off' : 'on'
                                        } fs-6 me-2"></i>
                                        ${
                                            row.isActive
                                                ? 'Deactivate'
                                                : 'Activate'
                                        }
                                    </a>
                                </div>
                            </div>`,
                    },
                ],
            })

            dt.on('draw', () => {
                if (window.KTMenu) KTMenu.createInstances()
            })
        }

        return { init: initDatatable }
    })()

    KTUtil.onDOMContentLoaded(() => {
        KTDatatablesServerSide.init()
    })

    $(document).on('click', '.toggle-status-btn', async function (e) {
        e.preventDefault()
        const id = $(this).data('id')
        const isActive = $(this).data('active')

        Swal.fire({
            title: isActive ? 'Deactivate Category?' : 'Activate Category?',
            text: isActive
                ? 'This category will be deactivated.'
                : 'This category will be activated.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, proceed!',
            cancelButtonText: 'Cancel',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn btn-primary fw-bold',
                cancelButton: 'btn btn-active-light fw-bold',
            },
        }).then(async (result) => {
            if (!result.isConfirmed) return
            try {
                const res = await fetch(`/admin/category/toggle-status/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await res.json()
                if (data.success) {
                    toastr.success(data.message)
                    $('#category_table').DataTable().ajax.reload(null, false)
                } else {
                    toastr.error(data.message || 'Failed to change status')
                }
            } catch (err) {
                console.error(err)
                toastr.error('Error while updating status')
            }
        })
    })
} catch (error) {
    console.error('Page initialization error:', error)
}
