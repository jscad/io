const fs = require('fs')
const test = require('ava')
const deserializer = require('./index.js')

test('translate ascii stl to jscad code', function (t) {
  const inputStlPath = './foo.stl'
  const inputStl = fs.readFileSync(inputStlPath)

  const expected = `function main(params) {
  var cag0 = new CAG();
  var cag00 = CAG.roundedRectangle({center: [57.8556,-52.2111], radius: [35.277775,35.277775], roundradius: 5.644443999999999});
  cag0 = cag0.union(cag00);
  var cag01 = CAG.roundedRectangle({center: [74.7889,-69.1444], radius: [35.277775,35.277775], roundradius: 11.288887999999998});
  cag0 = cag0.union(cag01);
  return cag0;
}
`
  const observed = deserializer.deserialize(inputStl, undefined, {output: 'jscad', addMetaData: false})
  t.deepEqual(observed, expected)
})
