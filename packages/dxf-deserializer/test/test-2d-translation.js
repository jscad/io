const fs = require('fs')
const path = require('path')
const test = require('ava')
const { CSG, CAG } = require('@jscad/csg')

import {nearlyEqual} from '../../../test/helpers/nearlyEqual'

const { deserialize } = require( '../index' )

//
// Test suite for DXF deserialization (import)
//
test('ASCII DXF 3D Entities translated to JSCAD Scripts', t => {
// DXF empty source, translate to header only
  let dxf1 = ''
  let src1 = deserialize(dxf1,'dxf1 test',{output: 'jscad'})

  t.is(src1.length,63)

// DXF CIRCLE, translate to CSG with 1 polygon
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
console.log(src2)
  let ss2 = src2.split("\n")
  t.is(ss2.length,4)
})

