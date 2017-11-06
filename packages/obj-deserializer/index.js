const { vt2jscad } = require('./vt2jscad')
const {CSG} = require('@jscad/csg')

function deserialize (obj, filename, options) { // http://en.wikipedia.org/wiki/Wavefront_.obj_file
  const defaults = {version: '0.0.0', addMetaData: true, output: 'jscad'}
  options = Object.assign({}, defaults, options)
  const {output} = options

  const {positions, faces} = getPositionsAndFaces(obj)
  return output === 'jscad' ? stringify({positions, faces, options}) : objectify({positions, faces, options})
}

const getPositionsAndFaces = data => {
  let lines = data.split(/\n/)
  let positions = []
  let faces = []

  for (let i = 0; i < lines.length; i++) {
    let s = lines[i]
    let a = s.split(/\s+/)

    if (a[0] === 'v') {
      positions.push([a[1], a[2], a[3]])
    } else if (a[0] === 'f') {
      let fc = []
      let skip = 0

      for (let j = 1; j < a.length; j++) {
        let c = a[j]
        c = c.replace(/\/.*$/, '') // -- if coord# is '840/840' -> 840
        c-- // -- starts with 1, but we start with 0
        if (c >= positions.length) {
          skip++
        }
        if (skip === 0) {
          fc.push(c)
        }
      }
         // fc.reverse();
      if (skip === 0) {
        faces.push(fc)
      }
    } else {
      // vn vt and all others disregarded
    }
  }
  return {positions, faces}
}

const objectify = ({positions, faces}) => {
  return CSG.polyhedron({points: positions, faces})
}

const stringify = ({positions, faces, addMetaData, filename, version}) => {
  let code = addMetaData ? `//
  // producer: OpenJSCAD.org Compatibility${version} OBJ deserializer
  // date: ${new Date()}
  // source: ${filename}
  //
  ` : ''
  // if(err) src += "// WARNING: import errors: "+err+" (some triangles might be misaligned or missing)\n";
  code += `// objects: 1
// object #1: polygons: ${faces.length}
function main() { return
${vt2jscad(positions, faces)}
}
  `
  return code
}

module.exports = {
  deserialize
}
