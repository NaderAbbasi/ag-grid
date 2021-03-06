const headerTemplate = '// <%= pkg.name %> v<%= pkg.version %>\n';

const gulp = require('gulp');
const header = require('gulp-header');
const pkg = require('./package.json');
const del = require('del');
const ngc = require('gulp-ngc');
const runSequence = require('run-sequence');
const rename = require("gulp-rename");

gulp.task('clean', function () {
    return del(['aot/**', '!aot',
        'dist/**', '!dist',
        './main.metadata.json', './main.js*', './main.d.ts']);
});

/*
 * ngc compilation tasks
 */
gulp.task('clean-ngc', (callback) => {
    return runSequence('clean', 'ngc', callback);
});

gulp.task('ngc', (callback) => {
    return runSequence('ngc-src', 'ngc-main', callback)
});

gulp.task('ngc-src', (callback) => {
    return ngc('./tsconfig-src.json', callback);
});

gulp.task('clean-build-main', ['build-main'], (callback) => {
    // post build cleanup
    return del(['./aot', 'exports.js*', 'exports.d.ts', 'exports.metadata.json'], callback);
});

gulp.task('build-main', ['ngc-main'], (callback) => {
    // this is here to facilitate the case where ag-grid-angular is symlinked into another project
    // if we have main.ts and leave it as that the the project that depends on ag-grid-angular (again, only if symlinked)
    // will complain about node_modules/ag-grid-angular/main.ts not being part of the source files
    gulp.src("./exports.js")
        .pipe(rename(('main.js')))
        .pipe(gulp.dest("./"));
    gulp.src("./exports.d.ts")
        .pipe(rename(('main.d.ts')))
        .pipe(gulp.dest("./"));
    return gulp.src("./exports.metadata.json")
        .pipe(rename(('main.metadata.json')))
        .pipe(gulp.dest("./"))
});

gulp.task('ngc-main', (callback) => {
    return gulp
        .src('./exports.ts')
        .pipe(ngc('./tsconfig-main.json', callback));
});

gulp.task('watch', ['clean-build-main'], () => {
    gulp.watch([
        './node_modules/ag-grid/dist/**/*', './node_modules/ag-grid/main.js',
        './node_modules/ag-grid-enterprise/dist/**/*', './node_modules/ag-grid-enterprise/main.js',
        './src/**/*'
    ], ['clean-ngc']);
});

// the main release task - clean, compile and add header template
gulp.task('release', ['clean-ngc'], function () {
    require('./agGridPropertiesCheck');
    gulp.src(['./dist/', '!./dist/**/*.metadata.json'])
        .pipe(header(headerTemplate, {pkg: pkg}))
        .pipe(gulp.dest('./dist/'));
});

