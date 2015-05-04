'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('vcldoc');
var _ = require('lodash');
var resolve = require('resolve');
var preprocessor = require('vcl-preprocessor');

var docClient = require('vcl-doc-client');

var marked = require('marked');

var fetchPackage = function(name, options) {
  // TODO: get package.json using require
  debug('fetching package: %s', name);
  _.defaults(options, {
    metaName: 'vcl'
  });

  function fixNoMain(pkg) {
    // make all modules require-able
    pkg.main = 'package.json';
    return pkg;
  }
  var npmModule = null;
  // get module information
  var npmModulePath = resolve.sync(name, {
    basedir: process.cwd(),
    packageFilter: fixNoMain
  });
  var basePath = path.dirname(npmModulePath) + '/';
  npmModule = JSON.parse(fs.readFileSync(npmModulePath, 'utf8'));

  var pack = npmModule;

  if (pack.vcl === undefined) {
    debug('WARN: non vcl package passed!');
    return;
  }

  var readme;
  try {
    readme = fs.readFileSync(basePath + 'README.md');
  } catch (e) {
    debug(e);
    return;
  }

  // TODO: cleanup - filter and add
  var docPart = {
    name: name,
    basePath: basePath,
    fullPath: basePath + pack.style,
    docgen: pack[options.metaName],
    depdendencies: pack.depdendencies,
    devDependencies: pack.devDependencies,
    readme: readme,
    style: fs.readFileSync(basePath + pack.style), // TODO: async
    demos: {},
    description: pack.description
  };

  //console.debug(docPart);

  return renderPart(docPart, options);
};

var renderPart = function(docPart, options) {
  if (docPart.vcl === undefined) docPart.vcl = {};
  var lexer = new marked.Lexer();
  var tokens = lexer.lex(docPart.readme.toString());
  var tempLinks = tokens.links;
  debug('lexed part');

  var inUsage = false;
  var usageDepth = 1;

  tokens = _.filter(tokens, function(obj) {
    //console.debug(obj);
    // check if we are in the usage paragraph
    if (obj.type === 'heading') {
      if (obj.depth === 1 && options.removeTopHeading) return false;
      if (inUsage === true && obj.depth <= usageDepth) inUsage = false;
      else if (obj.text.toLowerCase() === 'usage') {
        usageDepth = obj.depth; // depth of the usage heading
        inUsage = true;
      }
      else if (obj.text.toLowerCase() === 'demo') {
        return false; // filters everything after demo
      }
    }
    debug('inUsage %s', inUsage);
    if (inUsage === false || obj.type !== 'paragraph') return true;

    //console.debug(obj);

    var result = /^\[(.*)\]\(\/(demo\/.*)\)$/.exec(obj.text);
    //console.debug(result);
    if (result !== null && result.length > 0) {
      var exPath = docPart.basePath + result[2];
      var key = path.basename(exPath, '.html');
      obj.text = '<div class="demo vclPanel" id="demo-' + key + '"></div>';

      docPart.demos[key] = fs.readFileSync(exPath, 'utf8');
    }
    return true;
  });

  tokens.links = tempLinks;
  var parsed = marked.parser(tokens);
  debug('done parsing');

  docPart.readme = parsed;

  var fallbackTitle = /vcl-(.+)/.exec(docPart.name);
  if (fallbackTitle.length >= 2){
    fallbackTitle = _.capitalize(fallbackTitle[1]);
  } else fallbackTitle = _.capitalize(docPart.name);
  docPart.title = docPart.vcl.title || fallbackTitle;

  if (options.cssProcessor === undefined) {
    options.cssProcessor = function(style, pack) {

      var css = preprocessor.package(pack.basePath, {
        providers: ['vcl-default-theme', 'vcl-default-theme-terms'],
        includeDevDependencies: true,
        docGenMode: true
      });

      return css.toString();

    };
  }

  if (options.cssProcessor !== undefined) {
    docPart.style = options.cssProcessor(docPart.style, docPart);
  }
  if (!docPart.style) docPart.style = '';

  return docPart;

};

function genJson(options) {
  var doc = options || {};
  _.defaults(options, {
    basePath: '',
    packages: [],
    parts: [],
    removeTopHeading: true
  });

  if (options.entryPackage !== undefined) {
    // TODO: use resolve
    var data = require(options.entryPackage);
    _.each(data.dependencies, function(val, key){
      // TODO: filter out non-vcl packages here
      options.packages.push(key);
    });
  }

  doc.packages.forEach(function(name) {
    var pack = fetchPackage(name, options);
    if (pack) doc.parts.push(pack);
  });
  return doc;
}

function genDoc(options) {
  var doc = genJson(options);
  _.defaults(options, {
    output: process.cwd() + '/./doc.json'
  });
  fs.writeFileSync(options.output, JSON.stringify(doc, null, 2));
}

function genHtml(options) {
  var doc = genJson(options);
  _.defaults(options, {
    output: process.cwd() + '/./somedoc.html'
  });
  docClient.getBuild(doc, function(html) {
    fs.writeFileSync(options.output, html);
  });
}

exports.generate = genDoc;
exports.generateJson = genDoc;
exports.generateHtml = genHtml;
