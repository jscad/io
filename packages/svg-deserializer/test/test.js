const fs = require('fs')
const test = require('ava')
// const {CAG} = require('@jscad/csg')
const svgDeSerializer = require('../index.js')

test('svg deserializer should handle minimal svgs correctly', t => {
  // one possible way to do it
  // const rawData = fs.readFileSync('./input.svg')
  // we could also create it manually
  const rawData = `<svg version="1.1" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
     <rect width="100%" height="100%" fill="red" />
</svg>`

// unfortunatly , our deserializers still produce jscad code instead of objects (CAG, CSG)
// other issue, the timestamp in the output, we just remove it
  const start = 100
  const observed = svgDeSerializer.deserialize(rawData).substring(start)
  const expected = `//
// producer: OpenJSCAD.org 0.0.0 SVG Importer
// date: Tue Sep 12 2017 22:59:58 GMT+0200 (CEST)
// source: svg
//
function main(params) {
  var cag0 = new CAG();
  cag0 = cag0.union(cag00);
  return cag0;
}`.substring(start)

  t.deepEqual(observed, expected)
})
