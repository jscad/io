const test = require('tape')
const {CSG, CAG} = require('@jscad/csg')
const deserializer = require('./index.js')

test('translate svg to jscad code', function (t) {
  t.plan(1)

  const sourceSvg = `
<svg xmlns="http://www.w3.org/2000/svg"
 width="467" height="462">
  <rect x="80" y="60" width="250" height="250" rx="20"/>
  <rect x="140" y="120" width="250" height="250" rx="40"/>
</svg>`

  // const sourceSvg = fs.readFileSync('PATH/TO/file.svg')

  const expected = `function main(params) {
  var cag0 = new CAG();
  var cag00 = CAG.roundedRectangle({center: [57.8556,-52.2111], radius: [35.277775,35.277775], roundradius: 5.644443999999999});
  cag0 = cag0.union(cag00);
  var cag01 = CAG.roundedRectangle({center: [74.7889,-69.1444], radius: [35.277775,35.277775], roundradius: 11.288887999999998});
  cag0 = cag0.union(cag01);
  return cag0;
}
`
  const observed = deserializer.translate(sourceSvg, undefined, {addMetaData: false})
  t.equal(observed, expected)
})


test('deserialize svg to cag/csg objects', function (t) {
  t.plan(1)

  const sourceSvg = `
<svg xmlns="http://www.w3.org/2000/svg"
 width="467" height="462">
  <rect x="80" y="60" width="250" height="250" rx="20"/>
  <rect x="140" y="120" width="250" height="250" rx="40"/>
</svg>`

  // const sourceSvg = fs.readFileSync('PATH/TO/file.svg')

  const observed = deserializer.deserialize(sourceSvg, undefined, {addMetaData: false})
  t.equal(observed.sides.length, 56)
})
