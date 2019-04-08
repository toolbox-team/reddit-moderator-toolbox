const gulp = require('gulp');
const zip = require('gulp-zip');
const exec = require('child_process').exec;
const fs = require('fs');
const jsdoc = require('gulp-jsdoc3');
const ftp = require( 'vinyl-ftp' );
const gutil = require( 'gulp-util' );
const argv = require('yargs').argv;

const src_dir = 'extension';
const output_dir = 'build/output';

const makeDocs = argv.docs;
const publishFTP = argv.ftp;

// Tasks
gulp.task('zip', function() {
    console.log(process.cwd());

    let ignores = fs.readFileSync(src_dir+'/.buildignore').toString().split("\n");
    for (let i = 0; i < ignores.length; i++) {
        if (ignores[i].startsWith("/")) {
            ignores[i] = "!"+src_dir+ignores[i];
        }
        else {
            ignores[i] = "!"+ignores[i];
        }
    }
    return gulp.src([src_dir+'/**'].concat(ignores))
        .pipe(zip('moderator-toolbox.zip'))
        .pipe(gulp.dest(output_dir));
});

gulp.task('doc', function (cb) {
    if(makeDocs) {
        const jsdocConfig = require('./jsdoc.json');
        gulp.src(['./extension/data/modules/*.js', './extension/data/*.js'], {read: false})
            .pipe(jsdoc(jsdocConfig, cb));
    } else {
        cb()
    }

});


gulp.task('doc2ftp', ['doc'], function (cb) {
    if (fs.existsSync('ftpconfig.json') && publishFTP) {
        const ftpConfig= JSON.parse(fs.readFileSync('ftpconfig.json', "utf8"));
        ftpConfig.log = gutil.log;
        const conn = ftp.create(ftpConfig);
        const globs = [
            'docs/**'
        ];
        return gulp.src( globs, { base: '.', buffer: false } )
        .pipe( conn.newer( '/' ) ) // only upload newer files
        .pipe( conn.dest( '/' ) );
    } else {
       cb()
    }

});


gulp.task('default', ['zip', 'doc', 'doc2ftp']);

