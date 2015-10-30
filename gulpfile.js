var gulp = require('gulp');
var zip = require('gulp-zip');
var shell = require('gulp-shell');

gulp.task('zip', function () {
    return gulp.src(['data/*',
                    '!data/*.plist',
                    '!data/background-safari.html',
                    '!data/Icon.png',
                    '!data/index.js',
                    '!data/package.js'])
        .pipe(zip('chrome-moderator-toolbox.zip'))
        .pipe(gulp.dest(''));
});

gulp.task('xpi', shell.task([
    'jpm xpi'
]));

gulp.task('default', ['zip', 'xpi']);
