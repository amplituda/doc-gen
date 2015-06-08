#!/usr/bin/env node
'use strict';

var minimist = require('minimist');
var docGenerator = require('../docgen');

// arguments
var argv = minimist(process.argv.slice(2));

docGenerator.generateHtml({
  name: argv.name || 'VCL Documentation',
  entryPackage: argv.entry || (process.cwd() + '/package.json'),
  output: argv.output || './vcl-documentation.html',
  basePath: argv.basePath || process.cwd()
});
