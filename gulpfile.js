var gulp = require('gulp');
var zip = require('gulp-zip');
var shell = require('gulp-shell');

gulp.task('zip', function() {
    console.log(process.cwd());

    return gulp.src(['extension/data/*',
        '!data/*.plist',
        '!data/background-safari.html',
        '!data/Icon.png',
        '!data/index.js',
        '!data/package.js'
    ])
        .pipe(zip('chrome-moderator-toolbox.zip'))
        .pipe(gulp.dest('extension/'));
});

gulp.task('xpi', shell.task([
    'jpm xpi'
], {
    cwd: 'extension/'
}));

gulp.task('default', ['zip', 'xpi']);
