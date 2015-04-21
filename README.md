VCL Docgen
==========


## Usage

Example:

```
var docGenerator = require('vcl-docgen');


docGenerator.generate({
  name: 'VCL Documentation',
  entryPackage: './package.json'
});

```

## Options

### name
The name of the documentation. When using `vcl-doc-client` this will be
displayed in the header and set as the page title.

**Default:** `name: 'VCL Documentation'`

### entryPackage
The package that the doc gen should parse to find all VCL dependencies &
generate the Documentation from.

**Example:** `entryPackage: './package.json'`

### packages
You can put paths to additional packages here or use this as an alternative to
the `entryPackage` option and provide your packages manually.

**Example:** `packages: ['../vcl-test', './some/package']`

### output
The file to output the finished json doc.

**Default:** `output: './doc.json'`

### removeTopHeading
This option will remove level 1 headings from the package readmes. Will default
to `true`, because most packages have the package name as the first heading and
the `vcl-doc-client` does already display the package name above the readme.

**Default:** `removeTopHeading: true`

### basePath
The base path.

**Example:** `basePath: './my-project'`
