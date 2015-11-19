var gulp = require('gulp');
var zip = require('gulp-zip');
var exec = require('child_process').exec;

var dest_dir = "extension/";

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
        .pipe(gulp.dest(dest_dir));
});

gulp.task('xpi', function(cb) {
    exec('jpm xpi', {cwd: 'extension/'}, function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        
        gulp.src('extension/*.xpi')
            .pipe(gulp.dest(dest_dir));
    });
});

gulp.task('default', ['zip', 'xpi']);
