toastr.options = {
    closeButton: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: 'toastr-bottom-right',
    preventDuplicates: false,
    onclick: null,
    showDuration: '300',
    hideDuration: '1000',
    timeOut: '8000',
    extendedTimeOut: '1000',
    showEasing: 'swing',
    hideEasing: 'linear',
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut',
}

// Delete
function deleteItem(element) {
    const id = element.getAttribute('id')
    const url = element.getAttribute('url')

    // console.log(url)

    Swal.fire({
        text: 'Are you sure you want to delete ?',
        icon: 'warning',
        showCancelButton: !0,
        buttonsStyling: !1,
        confirmButtonText: 'Yes, delete!',
        cancelButtonText: 'No, cancel',
        customClass: {
            confirmButton: 'btn fw-bold btn-danger',
            cancelButton: 'btn fw-bold btn-active-light-primary',
        },
    }).then((e) => {
        if (e.value) {
            fetch(url, {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                }),
            })
                .then(async (res) => {
                    const status = res.status
                    let data = await res.json()
                    if (status >= 200 && status < 300) {
                        toastr.success(data.message || 'You have deleted')
                        location.reload()
                    } else {
                        toastr.error(data.error || 'Something went wrong !')
                    }
                })
                .catch((err) => {
                    toastr.error('Something went wrong !')
                })
        }
    })
}
//- Change  status
function changeStatus(element, status) {
    const id = element.getAttribute('id')
    const url = element.getAttribute('url')
    fetch(url, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id,
            status,
        }),
    })
        .then(async (res) => {
            let data = await res.json()
            if (res.ok) {
                sessionStorage.setItem(
                    'toastrStatusMessage',
                    data.message || 'Status updated'
                )

                location.reload()
            } else {
                toastr.error(data.error || 'Something went wrong!')
            }
        })
        .catch((err) => {
            toastr.error('Something went wrong !')
        })
}
