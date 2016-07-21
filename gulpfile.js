var gulp = require('gulp');
var zip = require('gulp-zip');
var exec = require('child_process').exec;
var argv = require('yargs').argv;
var fs = require('fs');
var Stream = require('stream');
const Path = require('path');

var src_dir = "extension";
var dest_dir = "build";

// Used when the --post parameter is given to gulp in order to push the xpi to firefox.
var postUrl = "http://localhost:8888/";

// Renames the manifest for the specified browser (ex. manifest-chrome.json)
// to the appropriate "manifest.json" within the file stream.
function manifestFor(browser) {
    var stream = new Stream.Transform({objectMode: true});
    stream._transform = function (originalFile, unused, callback) {
        var file = originalFile.clone({contents: false});
        if (Path.basename(file.relative) == "manifest-"+browser+".json") {
            var dir = Path.dirname(file.relative);
            file.path = Path.join(file.base, dir, "manifest.json");
        }
        callback(null, file);
     };

    return stream;
}

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
        .pipe(manifestFor('chrome'))
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
