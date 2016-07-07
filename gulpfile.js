var gulp = require('gulp');
var zip = require('gulp-zip');
var exec = require('child_process').exec;
var argv = require('yargs').argv;

var src_dir = "extension";
var dest_dir = "build";

// Used when the --post parameter is given to gulp in order to push the xpi to firefox.
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
    exec('jpm '+(argv.post === undefined ? "xpi" : "post --post-url "+postUrl), {cwd: src_dir}, function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);

        // Move XPI to build dir
        var newPaths = gulp.src(src_dir+'/*.xpi')
            .pipe(gulp.dest(dest_dir));
        // Delete old XPI
        gulp.src(src_dir+'/*.xpi')
            .pipe(vinylPaths(del));

        return newPaths;
    });
});

gulp.task('default', ['zip', 'xpi']);
