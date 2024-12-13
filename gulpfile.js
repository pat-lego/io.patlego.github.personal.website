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
    src: 'src/styles/tailwind.css',
    dest: 'dist/css',
  },
};

// Task to clean the dist folder
export const dlte = (done) => {
  deleteSync('dist/**'); // Deletes everything in dist except the folder itself
  done();
};

// Task to include HTML partials
export const html = () => {
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

// Task to serve files with live reload
export const watch = () => {
  browser.init({
    server: {
      baseDir: 'dist',
    },
  });

  gulp.watch(paths.html.src, html);
  gulp.watch('src/styles/**/*.css', css);
};

// Default task executed by running yarn gulp
export default gulp.series(dlte, html, css, watch);

// can be executed by yarn gulp build
export const build = gulp.series(dlte, css, html);

// can be executed by yarn gulp build
export const clean = gulp.series(dlte);
