const fs = require('fs')
const path = require('path')
const test = require('ava')
const deserializer = require('./index.js')

const filesPath = path.resolve('../../node_modules/@jscad/sample-files') // require.resolve('@jscad/sample-files')

test('translate simple ascii stl to jscad code', function (t) {
  const inputStlPath = path.resolve(filesPath, 'stl/testcube_ascii.stl')
  const inputStl = fs.readFileSync(inputStlPath, 'utf8')

  const expected = `function main() { return union(
// objects: 1
// object #1: triangles: 12
polyhedron({ points: [
	[1,0,0],
	[1,1,0],
	[0,0,0],
	[1,1,0],
	[0,1,0],
	[0,0,0],
	[0,1,0],
	[0,1,1],
	[0,0,0],
	[0,1,1],
	[0,0,1],
	[0,0,0],
	[1,1,0],
	[1,1,1],
	[0,1,0],
	[1,1,1],
	[0,1,1],
	[0,1,0],
	[1,1,1],
	[1,1,0],
	[1,0,0],
	[1,0,1],
	[1,1,1],
	[1,0,0],
	[1,0,1],
	[1,0,0],
	[0,0,0],
	[0,0,1],
	[1,0,1],
	[0,0,0],
	[1,1,1],
	[1,0,1],
	[0,0,1],
	[0,1,1],
	[1,1,1],
	[0,0,1]],
	polygons: [
	[0,1,2],
	[3,4,5],
	[6,7,8],
	[9,10,11],
	[12,13,14],
	[15,16,17],
	[18,19,20],
	[21,22,23],
	[24,25,26],
	[27,28,29],
	[30,31,32],
	[33,34,35]] })
); }
`

  const observed = deserializer.deserialize(inputStl, undefined, {output: 'jscad', addMetaData: false})
  t.deepEqual(observed, expected)
})

test('translate simple binary stl to jscad code', function (t) {
  const inputStlPath = path.resolve(filesPath, 'stl/testcube_10mm.stl')
  const inputStl = fs.readFileSync(inputStlPath)

  const expected = `function main() { return union(
// objects: 1
// object #1: triangles: 12
polyhedron({ points: [
	[1,0,0],
	[1,1,0],
	[0,0,0],
	[1,1,0],
	[0,1,0],
	[0,0,0],
	[0,1,0],
	[0,1,1],
	[0,0,0],
	[0,1,1],
	[0,0,1],
	[0,0,0],
	[1,1,0],
	[1,1,1],
	[0,1,0],
	[1,1,1],
	[0,1,1],
	[0,1,0],
	[1,1,1],
	[1,1,0],
	[1,0,0],
	[1,0,1],
	[1,1,1],
	[1,0,0],
	[1,0,1],
	[1,0,0],
	[0,0,0],
	[0,0,1],
	[1,0,1],
	[0,0,0],
	[1,1,1],
	[1,0,1],
	[0,0,1],
	[0,1,1],
	[1,1,1],
	[0,0,1]],
	polygons: [
	[0,1,2],
	[3,4,5],
	[6,7,8],
	[9,10,11],
	[12,13,14],
	[15,16,17],
	[18,19,20],
	[21,22,23],
	[24,25,26],
	[27,28,29],
	[30,31,32],
	[33,34,35]] })
); }
`

  const observed = deserializer.deserialize(inputStl, undefined, {output: 'jscad', addMetaData: false})
  t.deepEqual(observed, expected)
})


/*test('deserialize simple ascii stl to cag/csg objects', function (t) {
  const inputStlPath = path.resolve(filesPath, 'stl/testcube_ascii.stl')
  const inputStl = fs.readFileSync(inputStlPath, 'utf8')

  const observed = deserializer.deserialize(inputStl, undefined, {output: 'csg', addMetaData: false})
  t.deepEqual(observed.polygons.length, 42)
})*/
