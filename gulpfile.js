var gulp = require('gulp');
var zip = require('gulp-zip');
var shell = require('gulp-shell');

gulp.task('zip', function() {
    console.log(process.cwd());

    return gulp.src(['extension/**',
        '!extension/*.plist',
        '!extension/*.zip',
        '!extension/*.xpi',
        '!extension/.jpmignore',
        '!extension/data/background-safari.html',
        '!extension/data/Icon.png'
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
