var gulp = require('gulp');
var zip = require('gulp-zip');
var exec = require('child_process').exec;

var src_dir = "extension";
var dest_dir = "build";
var postPost = true;
var postUrl = "http://localhost:8888/";

gulp.task('zip', function() {
    console.log(process.cwd());

    return gulp.src([src_dir+'/**',
        '!'+src_dir+'/*.plist',
        '!'+src_dir+'/*.zip',
        '!'+src_dir+'/*.xpi',
        '!'+src_dir+'/.jpmignore',
        '!'+src_dir+'/data/background/',
        '!'+src_dir+'/data/Icon.png'
    ])
        .pipe(zip('chrome-moderator-toolbox.zip'))
        .pipe(gulp.dest(dest_dir));
});

gulp.task('xpi', function(cb) {
    exec('jpm '+(postPost ? "post --post-url "+postUrl : "xpi"), {cwd: src_dir}, function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);

        gulp.src(src_dir+'/*.xpi')
            .pipe(gulp.dest(dest_dir));
    });
});

gulp.task('default', ['zip', 'xpi']);
