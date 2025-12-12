const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.authAdmin?.id && req.session.brandId) {
        return next()
    } else {
        return res.redirect('/admin/auth/login/')
    }
}

export { isAuthenticated }
