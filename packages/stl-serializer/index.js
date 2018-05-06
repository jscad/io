/*
JSCAD Object to STL Format Serialization

## License

Copyright (c) 2018 JSCAD Organization https://github.com/jscad

All code released under MIT license

Notes:
1) CAG conversion to:
     none
2) CSG conversion to:
     STL mesh
3) Path2D conversion to:
     none
*/

const {serializeBinary} = require('./CSGToStlb')
const {serializeText} = require('./CSGToStla')

const {ensureManifoldness} = require('@jscad/io-utils')
const {isCSG} = require('@jscad/csg')

const mimeType = 'application/sla'

const serialize = (options, ...objects) => {
  const defaults = {
    binary: true,
    statusCallback: null
  }
  options = Object.assign({}, defaults, options)

  // only use valid CSG objects
  let csgs = []
  objects.forEach(function (object, i) {
    if (isCSG(object) & object.polygons.length > 0) {
      csgs.push(ensureManifoldness(object))
    }
  })
  return options.binary ? serializeBinary(csgs, options) : serializeText(csgs, options)
}

module.exports = {
  mimeType,
  serialize
}
