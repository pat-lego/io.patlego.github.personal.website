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
    dest: 'dist/',
  },
  css: {
    src: 'src/styles/**/*.css',
    dest: 'dist/css',
  },
  assets: {
    src: 'src/assets/**/*',
    dest: 'dist/assets/',
  },
};

// Task to clean the dist folder
export const dlte = (done) => {
  deleteSync('dist/**', {force: true}); // Deletes everything in dist except the folder itself
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
    .pipe(gulp.dest('dist'))
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
    .pipe(gulp.dest('dist/blogs'))
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
      baseDir: 'dist',
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