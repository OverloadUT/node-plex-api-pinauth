module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            test: {
                options: {},
                src: ['test/**/*.js']
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'test',
                options: {}
            },
            coveralls: {
                src: ['test'], // multiple folders also works
                options: {
                    coverage:true, // this will make the grunt.event.on('coverage') event listener to be triggered
                    check: {
                        lines: 0,
                        statements: 0
                    },
                    reportFormats: ['cobertura','lcovonly']
                }
            }
        },
        shell: {
            deploy: {
                command: 'deploy.bat'
            }
        },
    });

    // Coveralls support
    grunt.event.on('coverage', function(lcov, done){
        require('coveralls').handleInput(lcov, function(err){
            if (err) {
                return done(err);
            }
            done();
        });
    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');

    // Default task(s).
    grunt.registerTask('default', ['mocha_istanbul:coverage']);
    grunt.registerTask('coverage', ['mocha_istanbul:coverage']);
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls']);
};