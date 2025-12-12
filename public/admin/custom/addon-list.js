try {
  ("use strict");

  let addonStatusBadge = {
    true: "success",
    false: "danger",
  };

  var KTDatatablesServerSide = (function () {
    var table;
    var dt;

    var initDatatable = function () {
      dt = $("#addon_table").DataTable({
        searchDelay: 500,
        processing: true,
        serverSide: true,
        order: [[4, "desc"]],
        orderable: false,
        lengthMenu: [25, 50, 75, 100],
        pageLength: 50,
        ajax: {
          url: `/admin/addon/json`,
        },
        columns: [
          {
            data: "name",
            className: "min-w-200px",
            defaultContent: "<i>Add-on Name</i>",
          },
          {
            data: "description",
            className: "min-w-250px",
            defaultContent: "<i>No description</i>",
          },
          {
            data: "price",
            className: "min-w-100px",
            defaultContent: "<i>Price</i>",
          },
          {
            data: "isActive",
            className: "min-w-70px",
          },
          {
            data: null,
            className: "text-center min-w-100px",
          },
        ],
        columnDefs: [
          {
            targets: 0,
            render: function (data, type, row) {
              return `<div class="d-flex flex-column">
                                <a class="text-gray-800 text-hover-primary fw-bold mb-1" href="/admin/addon/edit/${
                                  row.id
                                }">
                                    ${row.name || ""}
                                </a>
                                <span class="text-muted fs-7">${
                                  row._count?.foodItems || 0
                                } food item(s) using this</span>
                            </div>`;
            },
          },
          {
            targets: 1,
            render: function (data, type, row) {
              return `<span class="text-gray-600">${data || "-"}</span>`;
            },
          },
          {
            targets: 2,
            render: function (data, type, row) {
              return `<span class="fw-bold text-success">₹${parseFloat(
                data
              ).toFixed(2)}</span>`;
            },
          },
          {
            targets: 3,
            render: function (data, type, row) {
              let badgeClass = addonStatusBadge[data] || "secondary";
              let statusText = data ? "Active" : "Inactive";
              return `<div class="badge badge-light-${badgeClass} d-inline-flex align-items-end p-2">
                                <span class="fw-semibold fs-7">${statusText}</span>
                            </div>`;
            },
          },
          {
            targets: 4,
            data: null,
            className: "text-center",
            render: function (data, type, row) {
              let usageCount = row._count?.foodItems || 0;

              return `
                                <a href="#" class="btn btn-sm btn-light btn-flex btn-center btn-active-light-primary"
                                   data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                    Actions
                                    <i class="ki-outline ki-down fs-5 ms-1"></i>
                                </a>
                                <div class="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4" data-kt-menu="true">
                                    <div class="menu-item px-3">
                                        <a href="/admin/addon/edit/${
                                          row.id
                                        }" class="menu-link px-3">
                                            <i class="ki-outline ki-pencil fs-6 me-2"></i>Edit
                                        </a>
                                    </div>
                                    <div class="menu-item px-3">
                                        <a class="menu-link px-3" onclick="toggleStatus('${
                                          row.id
                                        }')">
                                            <i class="ki-outline ki-toggle-${
                                              row.isActive ? "off" : "on"
                                            } fs-6 me-2"></i>
                                            ${
                                              row.isActive
                                                ? "Deactivate"
                                                : "Activate"
                                            }
                                        </a>
                                    </div>
                                    ${
                                      usageCount === 0
                                        ? `
                                    <div class="separator my-2"></div>
                                    <div class="menu-item px-3">
                                        <a class="menu-link px-3 text-danger" onclick="deleteAddOn('${row.id}')">
                                            <i class="ki-outline ki-trash fs-6 me-2"></i>Delete
                                        </a>
                                    </div>
                                    `
                                        : `
                                    <div class="separator my-2"></div>
                                    <div class="menu-item px-3">
                                        <div class="menu-content px-3">
                                            <span class="text-muted fs-8">Cannot delete: In use</span>
                                        </div>
                                    </div>
                                    `
                                    }
                                </div>
                            `;
            },
          },
        ],
      });

      table = dt.$;

      // Search Datatable
      const filterSearch = document.querySelector(
        '[data-kt-addon-filter="search"]'
      );
      if (filterSearch) {
        filterSearch.addEventListener("keyup", function (e) {
          dt.search(e.target.value).draw();
        });
      }

      // Status filter
      let statusSelect = document.querySelector("#addon_status_filter");
      if (statusSelect) {
        $(statusSelect).on("change", function () {
          let val = this.value;
          dt.column(3).search(val).draw();
        });
      }

      // Re-init functions on every table re-draw
      dt.on("draw", function (e) {
        if (window.KTMenu) KTMenu.createInstances();
      });
    };

    // Public methods
    return {
      init: function () {
        initDatatable();
      },
    };
  })();

  // On document ready
  KTUtil.onDOMContentLoaded(function () {
    KTDatatablesServerSide.init();
  });
} catch (error) {
  console.log("ERR", error);
}

// Toggle status function
// async function toggleStatus(id) {
//   if (confirm("Are you sure you want to change the status?")) {
//     try {
//       const response = await fetch(`/admin/addon/toggle-status/${id}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//       });
//       const result = await response.json();

//       if (result.success) {
//         toastr.success(result.message);
//         $("#addon_table").DataTable().ajax.reload();
//       } else {
//         toastr.error(result.message);
//       }
//     } catch (error) {
//       toastr.error("An error occurred");
//       console.error(error);
//     }
//   }
// }

// Delete add-on function
// async function deleteAddOn(id) {
//   if (
//     confirm(
//       "Are you sure you want to delete this add-on? This action cannot be undone."
//     )
//   ) {
//     try {
//       const response = await fetch(`/admin/addon/delete/${id}`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//       });
//       const result = await response.json();

//       if (result.success) {
//         toastr.success(result.message);
//         $("#addon_table").DataTable().ajax.reload();
//       } else {
//         toastr.error(result.message);
//       }
//     } catch (error) {
//       toastr.error("An error occurred");
//       console.error(error);
//     }
//   }
// }
