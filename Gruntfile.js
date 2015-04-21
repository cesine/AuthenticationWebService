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
      symlinkFieldDBIfAvailable: {
        cmd: function() {
          return 'if [ -z ${FIELDDB_HOME} ]; ' +
            ' then ' +
            ' echo "Not using the most recent FieldDB, some functions might not work.";' +
            ' else ' +
            ' echo "Symlinking FieldDB to your local dev version in $FIELDDB_HOME/FieldDB/api";' +
            ' rm -rf node_modules/fielddb/package.json;' +
            ' rm -rf node_modules/fielddb/api;' +
            ' rm -rf node_modules/fielddb/tests;' +
            ' rm -rf node_modules/fielddb/sample_data;' +
            ' ln -s $FIELDDB_HOME/FieldDB/package.json node_modules/fielddb/package.json;' +
            ' ln -s $FIELDDB_HOME/FieldDB/api node_modules/fielddb/api;' +
            ' ln -s $FIELDDB_HOME/FieldDB/tests node_modules/fielddb/tests;' +
            ' ln -s $FIELDDB_HOME/FieldDB/sample_data node_modules/fielddb/sample_data;' +
            ' ls node_modules/fielddb;'+
            ' fi ';
        }
      },
      updateFieldDB: {
        cmd: function() {
          return 'if [ -z ${FIELDDB_HOME} ]; ' +
            ' then ' +
            ' echo "Not using the most recent FieldDB, some functions might not work.";' +
            ' else ' +
            ' echo "Updating FieldDB in $FIELDDB_HOME/FieldDB/fielddb.js";' +
            ' cd $FIELDDB_HOME;' +
            ' git clone https://github.com/cesine/FieldDB.git;' +
            ' cd $FIELDDB_HOME/FieldDB;' +
            ' pwd; ' +
            ' git remote add cesine https://github.com/cesine/FieldDB.git;' +
            ' git checkout master;' +
            ' git pull cesine master;' +
            ' npm install; ' +
            ' fi ';
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
  grunt.registerTask('travis', ['exec:updateFieldDB','exec:symlinkFieldDBIfAvailable',  'nodeunit']);

};
