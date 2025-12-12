'use strict'

let planStatusBadge = {
    true: 'success',
    false: 'danger',
}

let planTypeBadge = {
    BASIC: 'primary',
    PREMIUM: 'warning',
    ULTIMATE: 'success',
}

var KTDatatablesServerSide = (function () {
    var table
    var dt

    var initDatatable = function () {
        dt = $('#plan_table').DataTable({
            searchDelay: 500,
            processing: true,
            serverSide: true,
            order: [[0, 'desc']],
            pageLength: 50,
            ajax: {
                url: `/admin/plan/json`,
            },
            columns: [
                { data: 'imageUrl' },
                { data: 'name' },
                { data: 'category.name' },
                { data: 'type' },
                { data: 'isActive' },
                { data: null },
            ],
            columnDefs: [
                {
                    targets: 0,
                    render: function (data, type, row) {
                        return `
                                <div class="symbol symbol-50px me-2">
                                    <img src="${row.imageUrl}" alt="${
                            row.name || ''
                        }"  class="rounded"/>
                                </div>  `
                    },
                },
                {
                    targets: 1,
                    render: (data, type, row) => `
                    <div class="d-flex flex-column">
                      <a href="/admin/plan/edit/${
                          row.id
                      }" class="text-gray-800 text-hover-primary fw-bold mb-1">
                        ${row.name || ''}
                      </a>
                      <span class="text-muted fs-7">${
                          row.description || ''
                      }</span>
                    </div>`,
                },
                {
                    targets: 2,
                    render: (data, type, row) =>
                        `<span class="fw-bold">${
                            row.category?.name || 'N/A'
                        }</span>`,
                },
                {
                    targets: 3,
                    render: (data) => {
                        const badgeClass = planTypeBadge[data] || 'secondary'
                        return `<span class="badge badge-light-${badgeClass} fw-bold">${
                            data || '-'
                        }</span>`
                    },
                },
                {
                    targets: 4,
                    render: (data) => {
                        const badgeClass = planStatusBadge[data]
                        const statusText = data ? 'Active' : 'Inactive'
                        return `<span class="badge badge-light-${badgeClass}">${statusText}</span>`
                    },
                },
                {
                    targets: 5,
                    render: (data, type, row) => `
                        <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
                        data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                        Actions <i class="ki-outline ki-down fs-5 ms-1"></i>
                        </a>
                        <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 
                            menu-state-bg-light-primary fw-semibold fs-7 w-200px py-4" data-kt-menu="true">
                        <div class="menu-item px-3">
                            <a href="/admin/plan/edit/${row.id}" class="menu-link px-3">
                            <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                            </a>
                        </div>
                        </div>`,
                },
            ],
        })

        const filterSearch = document.querySelector(
            '[data-kt-plan-filter="search"]'
        )
        filterSearch?.addEventListener('keyup', (e) =>
            dt.search(e.target.value).draw()
        )

        $('#plan_type_filter').on('change', function () {
            dt.column(2).search(this.value).draw()
        })

        $('#plan_status_filter').on('change', function () {
            dt.column(4).search(this.value).draw()
        })

        dt.on('draw', function () {
            if (window.KTMenu) KTMenu.createInstances()
        })
    }

    return { init: initDatatable }
})()

KTUtil.onDOMContentLoaded(() => KTDatatablesServerSide.init())
