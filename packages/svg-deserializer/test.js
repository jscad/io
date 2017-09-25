const test = require('tape')
const {CSG, CAG} = require('@jscad/csg')
const svgDeSerializer = require('./index-csg.js')

test('simple test svg to csg', function (t) {
  t.plan(1)

  const sourceSvg = `<?xml version="1.0"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg"
 width="467" height="462">
  <rect x="80" y="60" width="250" height="250" rx="20"
      style="fill:#ff0000; stroke:#000000;stroke-width:2px;" />
  <rect x="140" y="120" width="250" height="250" rx="40"
      style="fill:#0000ff; stroke:#000000; stroke-width:2px;
      fill-opacity:0.7;" />
</svg>`


  //const sourceSvg = fs.readFileSync('PATH/TO/file.svg')

  const expected = 42
  const observed = svgDeSerializer(sourceSvg, {})
  t.equal(observed, expected)
})
