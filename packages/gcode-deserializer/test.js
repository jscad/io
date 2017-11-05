const fs = require('fs')
const path = require('path')
const test = require('ava')
const deserializer = require('./index.js')

const filesPath = path.resolve('../../node_modules/@jscad/sample-files') // require.resolve('@jscad/sample-files')
const polygonsFromCsg = csg => csg.polygons.map(x => x.vertices.map(vert => ([vert.pos.x, vert.pos.y, vert.pos.z])))

test('translate simple gcode file to jscad code', function (t) {
  const inputPath = path.resolve(filesPath, 'gcode/cube_10mm.gcode')
  const inputFile = fs.readFileSync(inputPath, 'utf8')
  console.log('inputFile', inputFile)

  const expected = ``

  const observed = deserializer.deserialize(inputFile, undefined, {output: 'jscad', addMetaData: false})
  t.deepEqual(observed, expected)
})

test('deserialize simple gcode to cag/csg objects', function (t) {
  const inputPath = path.resolve(filesPath, 'gcode/cube_10mm.gcode')
  const inputFile = fs.readFileSync(inputPath, 'utf8')

  const observed = deserializer.deserialize(inputFile, undefined, {output: 'csg', addMetaData: false})
  t.deepEqual(observed.polygons.length, 6)

  const observedVertices = polygonsFromCsg(observed)
  const expectedVertices = [ [ [ 1, 1, 0 ], [ 1, 0, 0 ], [ 0, 0, 0 ], [ 0, 1, 0 ] ],
  [ [ 0, 1, 1 ], [ 0, 1, 0 ], [ 0, 0, 0 ], [ 0, 0, 1 ] ],
  [ [ 1, 1, 1 ], [ 1, 1, 0 ], [ 0, 1, 0 ], [ 0, 1, 1 ] ],
  [ [ 1, 1, 0 ], [ 1, 1, 1 ], [ 1, 0, 1 ], [ 1, 0, 0 ] ],
  [ [ 1, 0, 0 ], [ 1, 0, 1 ], [ 0, 0, 1 ], [ 0, 0, 0 ] ],
  [ [ 1, 0, 1 ], [ 1, 1, 1 ], [ 0, 1, 1 ], [ 0, 0, 1 ] ] ]
  t.deepEqual(observedVertices, expectedVertices)
})
