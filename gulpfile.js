import gulp from 'gulp';
import { deleteSync } from 'del';
import fileInclude from 'gulp-file-include';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import browserSync from 'browser-sync';
import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';

const browser = browserSync.create();

// Paths
const paths = {
  html: {
    src: 'src/**/*.html',
    dest: 'docs/',
  },
  css: {
    src: 'src/styles/**/*.css',
    dest: 'docs/css',
  },
  assets: {
    src: 'src/assets/**/*',
    dest: 'docs/assets/',
  },
  js: {
    src: 'src/js/**/*.js',
    dest: 'docs/js/',
  },
  cname: {
    src: 'CNAME',
    dest: 'docs',
  },
};

// Task to clean the docs folder
export const dlte = (done) => {
  deleteSync('docs/**', {force: true}); // Deletes everything in docs except the folder itself
  done();
};

// Task to include HTML partials
export const htmlPages = () => {
  return gulp
    .src('src/*.html')
    .pipe(
      fileInclude({
        prefix: '@@',
        basepath: '@file',
      })
    )
    .pipe(gulp.dest('docs'))
    .pipe(browser.stream());
};

// ---------------------------------------------------------------------------
// Blog posts
//
// Every post is rendered from ONE shared page, src/blogs/_post-template.html, using its entry in
// src/blogs/blogs.json (also the data behind the /blogs.html listing). The article body lives in
// src/blogs/partials/<slug>.html. Output: docs/blogs/<slug>.html.
// ---------------------------------------------------------------------------
const SITE_URL = 'https://www.patlego.com';
const BLOGS_JSON = 'src/blogs/blogs.json';
const BLOG_TEMPLATE = 'src/blogs/_post-template.html';
const DEFAULT_SOCIAL_IMAGE = { image: '/assets/social.png', imageWidth: 1080, imageHeight: 1080 };

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const absoluteUrl = (value) => (/^https?:\/\//.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`);

const imageType = (url) => {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }[ext];
};

// Reads blogs.json and fails the build with a clear message on anything that would publish a broken page.
const readBlogs = () => {
  const blogs = JSON.parse(fs.readFileSync(BLOGS_JSON, 'utf8'));
  const seen = new Set();
  for (const blog of blogs) {
    for (const field of ['slug', 'name', 'summary']) {
      if (!blog[field]) {
        throw new Error(`${BLOGS_JSON}: entry ${JSON.stringify(blog.slug || blog.name)} is missing "${field}"`);
      }
    }
    if (!/^[a-z0-9-]+$/.test(blog.slug)) {
      throw new Error(`${BLOGS_JSON}: slug "${blog.slug}" may only contain a-z, 0-9 and -`);
    }
    if (seen.has(blog.slug)) {
      throw new Error(`${BLOGS_JSON}: duplicate slug "${blog.slug}"`);
    }
    seen.add(blog.slug);
    if (!fs.existsSync(`src/blogs/partials/${blog.slug}.html`)) {
      throw new Error(`${BLOGS_JSON}: no article for "${blog.slug}" (expected src/blogs/partials/${blog.slug}.html)`);
    }
  }
  return blogs;
};

const renderBlogPage = (template, blog) => {
  const img = blog.image ? blog : DEFAULT_SOCIAL_IMAGE;
  const image = absoluteUrl(img.image);
  const type = imageType(image);
  const imageMeta = [
    `    <meta property="og:image" content="${escapeHtml(image)}" />`,
    type && `    <meta property="og:image:type" content="${type}" />`,
    img.imageWidth && `    <meta property="og:image:width" content="${img.imageWidth}" />`,
    img.imageHeight && `    <meta property="og:image:height" content="${img.imageHeight}" />`,
  ].filter(Boolean).join('\n');
  const values = {
    slug: blog.slug,
    url: `${SITE_URL}/blogs/${blog.slug}.html`,
    title: escapeHtml(blog.title || blog.name),
    description: escapeHtml(blog.description || blog.summary),
    image: escapeHtml(image),
    imageMeta,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? values[key] : match));
};

export const htmlBlogs = () => {
  const blogs = readBlogs();
  return gulp
    .src(BLOG_TEMPLATE)
    .pipe(new Transform({
      objectMode: true,
      transform(templateFile, _encoding, done) {
        const template = templateFile.contents.toString();
        for (const blog of blogs) {
          const page = templateFile.clone();
          // Pretend the page lives at src/blogs/<slug>.html so relative @@include paths resolve.
          page.path = path.join(templateFile.base, `${blog.slug}.html`);
          page.contents = Buffer.from(renderBlogPage(template, blog));
          this.push(page);
        }
        done();
      },
    }))
    .pipe(
      fileInclude({
        prefix: '@@',
        basepath: '@file',
      })
    )
    .pipe(gulp.dest('docs/blogs'))
    .pipe(browser.stream());
};

// Task to include HTML partials for store product pages
export const htmlStore = () => {
  return gulp
    .src('src/store/**/*.html')
    .pipe(
      fileInclude({
        prefix: '@@',
        basepath: '@file',
      })
    )
    .pipe(gulp.dest('docs/store'))
    .pipe(browser.stream());
};

// Task to process CSS using PostCSS
export const css = () => {
  return gulp
    .src(paths.css.src)
    .pipe(sourcemaps.init())
    .pipe(postcss())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browser.stream());
};

// Task to copy assets
export const assets = () => {
  return gulp.src(paths.assets.src, {encoding: false})
    .pipe(gulp.dest(paths.assets.dest));
};

// Task to copy shared scripts (loaded with <script src>, so they are not copied into every page)
export const js = () => {
  return gulp.src(paths.js.src)
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browser.stream());
};

// Task to serve files with live reload
export const watch = () => {
  browser.init({
    server: {
      baseDir: 'docs',
    },
  });

  gulp.watch([paths.html.src, BLOGS_JSON], gulp.series(css, htmlBlogs, htmlStore, htmlPages));
  gulp.watch(paths.assets.src, assets);
  gulp.watch(paths.js.src, gulp.series(js, css));
};


// Default task executed by running yarn gulp
export default gulp.series(dlte, gulp.parallel(css, htmlBlogs, htmlStore, htmlPages, assets, js), watch);

// can be executed by yarn gulp build
export const build = gulp.series(dlte, gulp.parallel(css, htmlBlogs, htmlStore, htmlPages, assets, js));

export const deploy = gulp.series(build, () => {
  return gulp.src(paths.cname.src)
    .pipe(gulp.dest(paths.cname.dest));
});

// can be executed by yarn gulp clean
export const clean = gulp.series(dlte);