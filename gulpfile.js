const { src, dest, series, watch } = require('gulp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const cssminify = require('gulp-clean-css');

function jsAssets(cd) {
  src('src/assets/js/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('public/assets/js'));
    
    cd();
}

function cssAssets(cd) {
    src('src/assets/css/*.css')
    .pipe(cssminify())
    .pipe(dest('public/assets/css'));
    
    cd();
}

/* custom */
function validateJs(cd) {
    src('src/assets/vendor/contact-email-form/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('public/assets/vendor/contact-email-form'));
    
    cd();
}

function tableSorterJs(cd) {
    src('src/assets/vendor/tableSorter/js/*.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('public/assets/vendor/tableSorter/js'));
    
    cd();
}

function tableSorterCss(cd) {
    src('src/assets/vendor/tableSorter/css/*.css')
    .pipe(cssminify())
    .pipe(dest('public/assets/vendor/tableSorter/css'));
    
    cd();
}

exports.default = function() {
    watch('src/assets/js/*.js', series(jsAssets));
    watch('src/assets/css/*.css', series(cssAssets));
    watch('src/assets/vendor/contact-email-form/*.js', series(validateJs));
    watch('src/assets/vendor/tableSorter/js/*.js', series(tableSorterJs));
    watch('src/assets/vendor/tableSorter/css/*.css', series(tableSorterCss));
}

// exports.default = series(jsAssets, cssAssets, validateJs, tableSorterJs, tableSorterCss);