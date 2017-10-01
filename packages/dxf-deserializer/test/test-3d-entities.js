const fs = require('fs')
const path = require('path')
const test = require('ava')
const { CSG, CAG } = require('@jscad/csg')

import {nearlyEqual} from '../../../test/helpers/nearlyEqual'

const { instantiate, deserialize } = require( '../index' )

//
// Test suite for DXF deserialization (import)
//
test('ASCII DXF 3D Entities to Object Conversion', t => {
  const dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/bourke/3d-entities.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect one layer, containing 2 objects (CSG, and Line3D)
  t.true(Array.isArray(objs))
  t.is(objs.length,2)
  t.true(objs[0] instanceof CSG)
  t.true(objs[1] instanceof CSG.Line3D)
})

test('ASCII DXF from JSCAD to Object Conversion',  t => {
// instantiate from a simple shape
  let dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/jscad/pyramid.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  let dxf  = fs.readFileSync(dxfPath, 'UTF8')
  let objs = instantiate(dxf,{})

// expect one layer, containing one solid (CSG)
  t.true(Array.isArray(objs))
  t.is(objs.length,1)
  let csg = objs[0]
  t.true(csg instanceof CSG)
  let features = csg.getFeatures(['volume', 'area'])
  //nearlyEqual(t, features[0], 5462.38756989, 1e-8)
  //nearlyEqual(t, features[1], 3000.18768622, 1e-8)

// instantiate from a simple shape
  dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/jscad/cube.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  dxf  = fs.readFileSync(dxfPath, 'UTF8')
  objs = instantiate(dxf,{})

// expect one layer, containing one solid (CSG)
  t.true(Array.isArray(objs))
  t.is(objs.length,1)
  csg = objs[0]
  t.true(csg instanceof CSG)
  features = csg.getFeatures(['volume', 'area'])
  //nearlyEqual(t, features[0], 8000, 1e-8)
  //nearlyEqual(t, features[1], 2400, 1e-8)

// instantiate from a simple shape
  dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/jscad/sphere.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  dxf  = fs.readFileSync(dxfPath, 'UTF8')
  objs = instantiate(dxf,{})

// expect one layer, containing one solid (CSG)
  t.true(Array.isArray(objs))
  t.is(objs.length,1)
  csg = objs[0]
  t.true(csg instanceof CSG)
  features = csg.getFeatures(['volume', 'area'])
  //nearlyEqual(t, features[0], 3732.05078230, 1e-8)
  //nearlyEqual(t, features[1], 1186.12882818, 1e-8)

// instantiate from a simple shape
  dxfPath = path.resolve(__dirname, '../../../../sample-files/dxf/jscad/cylinder.dxf')
  t.deepEqual(true, fs.existsSync(dxfPath))

  dxf  = fs.readFileSync(dxfPath, 'UTF8')
  objs = instantiate(dxf,{})

// expect one layer, containing one solid (CSG)
  t.true(Array.isArray(objs))
  t.is(objs.length,1)
  csg = objs[0]
  t.true(csg instanceof CSG)
  features = csg.getFeatures(['volume', 'area'])
  //nearlyEqual(t, features[0], 6242.89017101, 1e-8)
  //nearlyEqual(t, features[1], 1878.90839990, 1e-8)
})

