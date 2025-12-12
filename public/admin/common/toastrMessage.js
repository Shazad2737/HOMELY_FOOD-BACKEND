const msg = sessionStorage.getItem('toastrStatusMessage')
if (msg) {
    toastr.success(msg)
    sessionStorage.removeItem('toastrStatusMessage')
}
