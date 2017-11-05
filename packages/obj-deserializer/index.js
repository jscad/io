const { vt2jscad } = require('./vt2jscad')

function deserialize (obj, filename, options) { // http://en.wikipedia.org/wiki/Wavefront_.obj_file
  const defaults = {version: '0.0.0', addMetaData: true, output: 'jscad'}
  options = Object.assign({}, defaults, options)
  const {version, output, addMetaData} = options

  let l = obj.split(/\n/)
  let v = []
  let f = []

  for (let i = 0; i < l.length; i++) {
    let s = l[i]
    let a = s.split(/\s+/)

    if (a[0] === 'v') {
      v.push([a[1], a[2], a[3]])
    } else if (a[0] === 'f') {
      let fc = []
      let skip = 0

      for (let j = 1; j < a.length; j++) {
        let c = a[j]
        c = c.replace(/\/.*$/, '') // -- if coord# is '840/840' -> 840
        c-- // -- starts with 1, but we start with 0
        if (c >= v.length) {
          skip++
        }
        if (skip === 0) {
          fc.push(c)
        }
      }
         // fc.reverse();
      if (skip === 0) {
        f.push(fc)
      }
    } else {
      // vn vt and all others disregarded
    }
  }
  let code = addMetaData ? `//
  // producer: OpenJSCAD.org Compatibility${version} OBJ deserializer
  // date: ${new Date()}
  // source: ${filename}
  //
  ` : ''
  // if(err) src += "// WARNING: import errors: "+err+" (some triangles might be misaligned or missing)\n";
  code += `// objects: 1
// object #1: polygons: ${f.length}
function main() { return
${vt2jscad(v, f)}
}
  `
  return code
}

module.exports = {
  deserialize
}
