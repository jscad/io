## @jscad/amf-writer

> amf writer for the jscad project (from CSG)

[![GitHub version](https://badge.fury.io/gh/jscad%2Fio.svg)](https://badge.fury.io/gh/jscad%2Famf-writer)
[![Build Status](https://travis-ci.org/jscad/io.svg)](https://travis-ci.org/jscad/amf-writer)

## Overview

This writer outputs a 'blobable' array of data (from a CSG object)
ie an array that can either be passed directly to a Blob (`new Blob(blobable)`)
or converted to a Node.js buffer.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)


## Installation

```
npm install @jscad/amf-writer
```

## Usage


```javascript
const amfWriter = require('@jscad/amf-writer')

const rawData = amfWriter(CSGObject)

//in browser (with browserify etc)
const blob = new Blob(rawData)

```


## Contribute

For questions about the API, please contact the [User Group](https://plus.google.com/communities/114958480887231067224)

PRs accepted.

Small Note: If editing this README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.


## License

[The MIT License (MIT)](https://github.com/jscad/io/blob/master/LICENSE)
(unless specified otherwise)