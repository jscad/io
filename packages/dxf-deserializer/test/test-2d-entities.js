const fs = require('fs')
const path = require('path')
const test = require('ava')
const { CSG, CAG } = require('@jscad/csg')

import {nearlyEqual} from '../../../test/helpers/nearlyEqual'

const { instantiate, deserialize } = require( '../index' )

//
// Test suite for DXF deserialization (import)
//
test('ASCII DXF 2D Entities from JSCAD to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/jscad/square10x10.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect one layer, containing 1 objects (CAG)
  t.true(Array.isArray(objs))
  t.is(objs.length,1)
  t.true(objs[0] instanceof CAG)

  dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/jscad/circle10.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  dxf = fs.readFileSync(dxfPath, 'UTF8')
  objs = instantiate(dxf,{})

// expect one layer, containing 1 objects (CAG)
  t.true(Array.isArray(objs))
  t.is(objs.length,1)
  t.true(objs[0] instanceof CAG)
})

test('ASCII DXF 2D Lines from Autocad 2017 to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/autocad2017/2Dlines.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect array containing 23 objects (6 CSG.Path2D, 17 CSG.Line3D)
  t.true(Array.isArray(objs))
  t.is(objs.length,23)
  t.true(objs[6] instanceof CSG.Line3D)
})

test('ASCII DXF 2D Circles from Autocad 2017 to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/autocad2017/2Dcircles.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect array containing 23 objects (3 CAG)
  t.true(Array.isArray(objs))
  t.is(objs.length,23)
  t.true(objs[0] instanceof CAG)
  // NOTE: the extra objects are from the page layout
  t.true(objs[7] instanceof CAG)
  t.true(objs[8] instanceof CAG)
})

test('ASCII DXF 2D Rectangles from Autocad 2017 to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/autocad2017/2Drectangles.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect array containing 23 objects (3 CAG)
  t.true(Array.isArray(objs))
  t.is(objs.length,23)
  // NOTE: the extra objects are from the page layout
  t.true(objs[6] instanceof CAG)
  t.is(objs[6].sides.length,4) // rectangle
  t.true(objs[7] instanceof CAG)
  t.is(objs[7].sides.length,4) // rectangle
  t.true(objs[8] instanceof CAG)
  t.is(objs[8].sides.length,4) // rectangle
})

test('ASCII DXF 2D Donuts from Autocad 2017 to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/autocad2017/2Ddonuts.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect array containing 23 objects (3 CAG)
  t.true(Array.isArray(objs))
  t.is(objs.length,23)
})

test('ASCII DXF 2D Ellipses from Autocad 2017 to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/autocad2017/2Dellipses.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect array containing 23 objects (3 CAG)
  t.true(Array.isArray(objs))
  t.is(objs.length,20)
})

test('ASCII DXF 2D Arcs from Autocad 2017 to Object Conversion', t => {
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/autocad2017/2Darcs.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect array containing 23 objects (9 CSG.Path2D, 14 CSG.Line3D)
  t.true(Array.isArray(objs))
  t.is(objs.length,23)
  // NOTE: the extra ojbects are from the page layout
  t.true(objs[6] instanceof CSG.Path2D)
  t.true(objs[7] instanceof CSG.Path2D)
  t.true(objs[8] instanceof CSG.Path2D)
})

// ELLIPSE
// HATCH as what ?
// MLINE as what ?
// POINT as what ?
// RAY as what ?
// SPLINE as Path2D
// TRACE ?
// XLINE ?

