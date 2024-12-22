import gulp from 'gulp';
import { deleteSync } from 'del';
import fileInclude from 'gulp-file-include';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import browserSync from 'browser-sync';

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

// Task to include HTML partials
export const htmlBlogs = () => {
  return gulp
    .src('src/blogs/**/*.html')
    .pipe(
      fileInclude({
        prefix: '@@',
        basepath: '@file',
      })
    )
    .pipe(gulp.dest('docs/blogs'))
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

// Task to serve files with live reload
export const watch = () => {
  browser.init({
    server: {
      baseDir: 'docs',
    },
  });

  gulp.watch(paths.html.src, gulp.series(css, htmlBlogs, htmlPages));
  gulp.watch(paths.assets.src, assets);
};


// Default task executed by running yarn gulp
export default gulp.series(dlte, gulp.parallel(css, htmlBlogs, htmlPages, assets), watch);

// can be executed by yarn gulp build
export const build = gulp.series(dlte, gulp.parallel(css, htmlBlogs, htmlPages, assets));

// can be executed by yarn gulp clean
export const clean = gulp.series(dlte);