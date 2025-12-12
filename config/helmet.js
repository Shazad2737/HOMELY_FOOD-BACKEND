import helmet from 'helmet'

const helmetConfig = helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'default-src': ["'self'"],

            // Allow scripts from self and CDNs (for ArticleEditor dependencies like moment-timezone)
            'script-src': ["'self'", 'https://cdnjs.cloudflare.com'],

            // Allow images from your domains & CDNs
            'img-src': [
                "'self'",
                'data:',
                'https:', // Allow all HTTPS images (for ArticleEditor uploaded images)
                'https://ik.imagekit.io',
            ],

            // Allow inline styles (required for Metronic and ArticleEditor)
            'style-src': [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
            ],

            // Allow fonts from Google Fonts and base64 data (ArticleEditor uses base64 fonts)
            'font-src': [
                "'self'",
                'data:', // Required for ArticleEditor base64 embedded fonts
                'https://fonts.googleapis.com',
                'https://fonts.gstatic.com',
            ],

            // Allow connections to ImageKit and self
            'connect-src': ["'self'", 'https://ik.imagekit.io'],
        },
    },
    crossOriginEmbedderPolicy: false,
})

export default helmetConfig
