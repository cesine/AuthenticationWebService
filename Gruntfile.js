'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js'],
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'nodeunit']
      },
    },
    exec: {
      curl_tests: {
        cmd: function() {
          return "bash test/routes/deprecated.sh";
        }
      },
      sim_link_fielddb_npm: {
        cmd: function() {
          return "ls ../FieldDB && rm -rf node_modules/fielddb && ln -s $FIELDDB_HOME/FieldDB node_modules/fielddb && ls -al node_modules/fielddb";
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks("grunt-exec");

  // Default task.
  grunt.registerTask('default', ['jshint', 'nodeunit', 'exec:curl_tests']);
  grunt.registerTask('test', ['nodeunit', 'exec:curl_tests']);
  grunt.registerTask('travis', ['nodeunit']);

};
