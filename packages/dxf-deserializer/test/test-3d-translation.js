const fs = require('fs')
const path = require('path')
const test = require('ava')
const { CSG, CAG } = require('@jscad/csg')

import {nearlyEqual} from '../../../test/helpers/nearlyEqual'

const { deserialize } = require( '../index' )

//
// Test suite for DXF deserialization (import)
//
test.skip('ASCII DXF 3D Entities translated to JSCAD Scripts', t => {
// DXF CIRLCE, translate to CAG.circle
  let dxf2 = `0
SECTION
2
ENTITIES
0
3DFACE
8
0
10
-10.000000
20
-10.000000
30
-10.000000
11
-10.000000
21
10.000000
31
10.000000
12
-10.000000
22
10.000000
32
-10.000000
13
-10.000000
23
10.000000
33
-10.000000
0
ENDSEC`
  let src2 = deserialize(dxf2,'dxf2 test',{output: 'jscad'})
console.log(src2)
  let ss2 = src2.split("\n")
  t.is(ss2.length,9)
})

