const fs = require('fs')
const path = require('path')
const test = require('ava')
const { CSG, CAG } = require('@jscad/csg')

import {nearlyEqual} from '../../../test/helpers/nearlyEqual'

const { deserialize } = require( '../index' )

//
// Test suite for DXF deserialization (import)
//
test('ASCII DXF 2D Entities translated to JSCAD Scripts', t => {
// DXF empty source, translate to header only
  let dxf1 = ''
  let src1 = deserialize(dxf1,'dxf1 test',{output: 'jscad'})
  let ss1 = src1.split("\n")
  t.is(ss1.length,3)

// DXF CIRCLE, translates to script with CAG.circle()
  let dxf2 = `0
SECTION
2
ENTITIES
0
CIRCLE
  8
0
 10
7.5
 20
17.5
 30
0.0
 40
2.5
  0
ENDSEC`
  let src2 = deserialize(dxf2,'dxf2 test',{output: 'jscad'})
  let ss2 = src2.split("\n")
  t.is(ss2.length,7)

// DXF LINE, translates to script with 'new CSG.Line3D'
  let dxf3 = `0
SECTION
2
ENTITIES
0
LINE
 10
32.375
 20
3.694299999999998
 30
0.0
 11
34.0
 21
3.694299999999998
 31
0.0
0
ENDSEC`
  let src3 = deserialize(dxf3,'dxf3-test',{output: 'jscad'})
  let ss3 = src3.split("\n")
  t.is(ss3.length,7)

// DXF ARC, translates to script with 'CSG.Path2D.arc'
  let dxf4 = `0
SECTION
2
ENTITIES
  0
ARC
  5
DD
100
AcDbEntity
  8
0
100
AcDbCircle
 10
8.75
 20
16.25
 30
0.0
 40
1.767766952966368
100
AcDbArc
 50
45.0
 51
225.0
0
ENDSEC`
  let src4 = deserialize(dxf4,'dxf4-test',{output: 'jscad'})
  let ss4 = src4.split("\n")
  t.is(ss4.length,7)

// DXF LWPOLYLINE without bulges, translates to script with CSG.Path2D, appendPoint(), and CAG.fromPoints()
  let dxf5 = `0
SECTION
2
ENTITIES
  0
LWPOLYLINE
 90
        4
 70
     1
 43
0.02
 10
1.5
 20
1.25
 10
32.25
 20
1.25
 10
32.25
 20
21.75
 10
1.5
 20
21.75
0
ENDSEC`
  let src5 = deserialize(dxf5,'dxf5-test',{output: 'jscad'})
  let ss5 = src5.split("\n")
  t.is(ss5.length,10)

// DXF LWPOLYLINE with bulges, translates to script with CSG.Path2D and CAG.fromPoints()
  let dxf6 = `0
SECTION
2
ENTITIES
  0
LWPOLYLINE
 90
        4
 70
     1
 43
0.02
 10
1.5
 20
1.25
 42
5.00
 10
32.25
 20
1.25
 42
5.00
 10
32.25
 20
21.75
 42
5.00
 10
1.5
 20
21.75
 42
5.00
0
ENDSEC`
  let src6 = deserialize(dxf6,'dxf6-test',{output: 'jscad'})
  let ss6 = src6.split("\n")
  t.is(ss6.length,10)

})

