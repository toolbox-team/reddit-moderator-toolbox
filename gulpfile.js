var gulp = require('gulp');
var zip = require('gulp-zip');
var exec = require('child_process').exec;
var argv = require('yargs').argv;
var fs = require('fs');
var vinylPaths =  require('vinyl-paths');
var del = require('del');

var src_dir = "extension";
var dest_dir = "build";

// Used when the --post parameter is given to gulp in order to push the xpi to firefox.
var postUrl = "http://localhost:8888/";

// Tasks
gulp.task('zip', function() {
    console.log(process.cwd());

    var ignores = fs.readFileSync(src_dir+'/.chromeignore').toString().split("\n");
    for (var i = 0; i < ignores.length; i++) {
        if (ignores[i].startsWith("/")) {
            ignores[i] = "!"+src_dir+ignores[i];
        }
        else {
            ignores[i] = "!"+ignores[i];
        }
    }

    return gulp.src([src_dir+'/**'].concat(ignores))
        .pipe(zip('chrome-moderator-toolbox.zip'))
        .pipe(gulp.dest(dest_dir));
});



gulp.task(['zip']);
