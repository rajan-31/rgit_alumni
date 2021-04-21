const { src, dest, series, parallel, watch } = require('gulp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const cssminify = require('gulp-clean-css');

function jsAssets(cb) {
  src('src/assets/js/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('public/assets/js'));
    
    cb();
}

function cssAssets(cb) {
    src('src/assets/css/*.css')
    .pipe(cssminify())
    .pipe(dest('public/assets/css'));
    
    cb();
}

/* custom */
function validateJs(cb) {
    src('src/assets/vendor/contact-email-form/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('public/assets/vendor/contact-email-form'));
    
    cb();
}

function tableSorterJs(cb) {
    src('src/assets/vendor/tableSorter/js/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('public/assets/vendor/tableSorter/js'));
    
    cb();
}

function tableSorterCss(cb) {
    src('src/assets/vendor/tableSorter/css/*.css')
    .pipe(cssminify())
    .pipe(dest('public/assets/vendor/tableSorter/css'));
    
    cb();
}

// continuous
// { ignoreInitial: false } => to run onetime then watch
exports.continuous = function() {
    watch('src/assets/js/*.js', { ignoreInitial: false }, series(jsAssets));
    watch('src/assets/css/*.css', { ignoreInitial: false }, series(cssAssets));
    watch('src/assets/vendor/contact-email-form/*.js', { ignoreInitial: false }, series(validateJs));
    watch('src/assets/vendor/tableSorter/js/*.js', { ignoreInitial: false }, series(tableSorterJs));
    watch('src/assets/vendor/tableSorter/css/*.css', { ignoreInitial: false }, series(tableSorterCss));
}

// onetime
exports.onetime = series(jsAssets, cssAssets, validateJs, tableSorterJs, tableSorterCss);

// exports.default = series(jsAssets, cssAssets, validateJs, tableSorterJs, tableSorterCss);