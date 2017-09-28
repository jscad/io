## @jscad/dxf-deserializer

> DXF deserializer for the JSCAD project

[![GitHub version](https://badge.fury.io/gh/jscad%40jscad%2Fstl-deserializer.svg)](https://badge.fury.io/gh/jscad%40jscad%2Fstl-deserializer)
[![Build Status](https://travis-ci.org/jscad/io.svg)](https://travis-ci.org/jscad/stl-deserializer)

## Overview

This deserializer converts raw DXF data to jscad code (that can be evaluated to CSG/CAG). 

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)


## Installation

```
npm install @jscad/dxf-deserializer
```

## Usage


```javascript
const stlDeSerializer = require('@jscad/dxf-deserializer')

const rawData = fs.readFileSync('PATH/TO/file.dxf')
const csgData = dxfDeSerializer(rawData)

```


## Contribute

For questions about the API, please contact the [User Group](https://plus.google.com/communities/114958480887231067224)

PRs accepted.

Small Note: If editing this README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.


## License

[The MIT License (MIT)](./LICENSE)
(unless specified otherwise)
