document.addEventListener('DOMContentLoaded', function () {
    // Initialize ArticleEditor for terms and conditions
    if (typeof ArticleEditor !== 'undefined') {
        ArticleEditor('.page_builder_content', {
            css: '/admin/article-editor/css/',
            image: {
                upload: '/admin/upload-article-image',
            },
        })
    } else {
        console.error('ArticleEditor is not loaded')
    }
})
