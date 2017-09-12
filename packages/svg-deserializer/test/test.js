const fs = require('fs')
const test = require('ava')
// const {CAG} = require('@jscad/csg')
const svgDeSerializer = require('../index.js')

test('CAG should extrudeInPlane', t => {
  const rawData = fs.readFileSync('./input.svg')
  const observed = svgDeSerializer(rawData)

  //const expected = c1.extrudeInPlane('X', 'Z', 5)
  t.is(observed.length, 66)
})
