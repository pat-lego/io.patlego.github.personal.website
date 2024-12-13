import gulp from 'gulp';
import { deleteSync } from 'del';
import fileInclude from 'gulp-file-include';
import browserSync from 'browser-sync';

const browser = browserSync.create();

// Task to clean the dist folder
export const clean = (done) => {
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

// Task to serve files with live reload
export const serve = () => {
  browser.init({
    server: {
      baseDir: 'dist',
    },
  });

  gulp.watch('src/**/*.html', html);
};

// Default task executed by running yarn gulp
export default gulp.series(clean, html, serve);

// can be executed by yarn gulp build
export const build = gulp.series(clean, html);
