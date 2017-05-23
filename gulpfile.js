const gulp = require('gulp');
const zip = require('gulp-zip');
const exec = require('child_process').exec;
const fs = require('fs');

const src_dir = "extension";
const dest_dir = "build";
const dest_dir2 = "build\\source";


function execute(execCommand, callback) {
    exec(execCommand, function (err, stdout, stderr) {
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
        console.log('err:', err);
    
        let success = stderr ? false : true;
        callback(success);
    });
}

// Tasks
gulp.task('zip', function() {
    console.log(process.cwd());

    let ignores = fs.readFileSync(src_dir+'/.chromeignore').toString().split("\n");
    for (let i = 0; i < ignores.length; i++) {
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

gulp.task('manifoldJS', function() {
    console.log(process.cwd());

    let ignores = fs.readFileSync(src_dir+'/.chromeignore').toString().split("\n");
    for (let i = 0; i < ignores.length; i++) {
        if (ignores[i].startsWith("/")) {
            ignores[i] = "!"+src_dir+ignores[i];
        }
        else {
            ignores[i] = "!"+ignores[i];
        }
    }
    
    gulp.src([src_dir+'/**'].concat(ignores))
        .pipe(gulp.dest(dest_dir2));
    

    // Hacky? Yes, very much but it seems to work   
        
    execute(`manifoldjs -l error -p edgeextension -f edgeextension -m ${dest_dir2}\\manifest.json -d ${dest_dir}`, function(result) {
        if(result) {
            // TODO: Actually manipulate manifest xml
            // TODO: Actually move logo files into place
            execute(`manifoldjs -l debug -p edgeextension package ${dest_dir}\\toolbox\\edgeextension\\manifest\\ -d ${dest_dir}`, function(result) {
                if(result) {
                    console.log('edge package build');
                } else {
                    console.log('problem executing second manifoldJS round');
                }
                
            });                
        } else {
            console.log('problem executing first manifoldJS round');
        }
    });
});
  
gulp.task('default', ['zip', 'manifoldJS']);
