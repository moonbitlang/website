blog_path="$1"
cover_name="$2"

mkdir -p "./static/img/blogs/$blog_path"
cp "./blog/$blog_path/$cover_name" "./static/img/blogs/$blog_path/$cover_name"

mkdir -p "./static/img/blogs/zh/$blog_path"
cp "./i18n/zh/docusaurus-plugin-content-blog/$blog_path/$cover_name" "./static/img/blogs/zh/$blog_path/$cover_name"
