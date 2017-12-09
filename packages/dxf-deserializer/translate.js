/*
## License

Copyright (c) 2017 Z3 Development https://github.com/z3dev

All code released under MIT license

*/
const { CSG, CAG } = require('@jscad/csg')

const {BYBLOCK, BYLAYER, getTLA} = require('./autocad')

function translateVector2D(vector) {
  let script = 'new CSG.Vector2D(' + vector.x + ',' + vector.y + ')'
  return script
}

function translateVector3D(vector) {
  let script = 'new CSG.Vector3D(' + vector.x + ',' + vector.y + ',' + vector.z + ')'
  return script
}

//
// translate the give object (3Dface) into CSG.Polygon
//
function translatePolygon (obj,layers,colorindex) {
  let vertices = []
// FIXME: should check global variable to create in the proper orientation
  vertices.push( new CSG.Vertex(new CSG.Vector3D( [obj['pptx'],obj['ppty'],obj['pptz']] ) ) )
  vertices.push( new CSG.Vertex(new CSG.Vector3D( [obj['sptx'],obj['spty'],obj['sptz']] ) ) )
  vertices.push( new CSG.Vertex(new CSG.Vector3D( [obj['tptx'],obj['tpty'],obj['tptz']] ) ) )
  if (obj['fptx']) {
    let pushit = false
    if (obj['tptx'] !== obj['fptx']) { pushit = true }
    if (obj['tpty'] !== obj['fpty']) { pushit = true }
    if (obj['tptz'] !== obj['fptz']) { pushit = true }
    if (pushit) {
      vertices.push( new CSG.Vertex(new CSG.Vector3D( [obj['fptx'],obj['fpty'],obj['fptz']] ) ) )
    }
  }
  let cn = getColorNumber(obj,layers)
  let shared = getColor(cn,colorindex)
  const polygon = new CSG.Polygon(vertices,shared)

  let script = 'new CSG.Polygon('
  for (let vertex of polygon.vertices) {
    script += translateVertex(vertex) + ','
  }
  script += translateShared(polygon.shared) + ','
  script += translatePlane(polygon.plane) + ')'
  return script
}

//
// translate the given DXF object (line) into 2D or 3D line
//
function translateLine (obj, layers, colorindex) {
  let script = '  let ' + obj['name'] + ' = '
  if (obj['pptz'] === obj['sptz'] & obj['pptz'] === 0) {
    let p1 = new CSG.Vector2D( [obj['pptx'],obj['ppty']] )
    let p2 = new CSG.Vector2D( [obj['sptx'],obj['spty']] )
    script += 'CSG.Line2D.fromPoints(' + translateVector2D(p1) + ',' + translateVector2D(p2) + ')\n'
  } else {
    let p1 = new CSG.Vector3D( [obj['pptx'],obj['ppty'],obj['pptz']] )
    let p2 = new CSG.Vector3D( [obj['sptx'],obj['spty'],obj['sptz']] )
    script += 'CSG.Line3D.fromPoints(' + translateVector3D(p1) + ',' + translateVector3D(p2) + ')\n'
  }
  obj['script'] = script
  addToLayer(obj,layers)
}

function instantiateVertex (obj) {
  const d3line = parseInt('00000000000100000', 2)
  const d3mesh = parseInt('00000000001000000', 2)
  const d3face = parseInt('00000000010000000', 2)

  let flags = obj['lflg']
  let vtype = null
  if ((flags & d3line) == 1) {
    vtype = new CSG.Vector3D( [obj['pptx'],obj['ppty'],obj['pptz']] )
  } else
  if ((flags & d3mesh) == 1) {
    vtype = new CSG.Vector3D( [obj['pptx'],obj['ppty'],obj['pptz']] )
  } else
  if ((flags & d3face) == 1) {
    vtype = new CSG.Vector3D( [obj['pptx'],obj['ppty'],obj['pptz']] )
  } else {
    vtype = new CSG.Vector2D( obj['pptx'],obj['ppty'] )
  }
  return vtype
}

//
// append a section to the given script
//
function addSection(script,x1,y1,bulg,px,py) {
  if (bulg === 0) {
  // add straight line to the end of the path
    script += '.appendPoint( [' + x1 + ',' + y1 + '] )'
  } else {
  // add arc to the end of the path
    let prev = new CSG.Vector2D(px,py)
    let curr = new CSG.Vector2D(x1,y1)
    let u = prev.distanceTo(curr)
    let r = u * ((1 + Math.pow(bulg,2)) / (4 * bulg))
    let clockwise = (bulg < 0)
    let large     = false // FIXME how to determine?
    let d = Math.atan(bulg) / (Math.PI/180) * 4
  // FIXME; add resolution
    script += '.appendArc([' + x1 + ',' + y1 + '],{radius: ' + r + ',xaxisrotation: ' + d + ',clockwise: ' + clockwise + ',large: ' + large + '})'
  }
  return script
}

//
// translate the given obj (lwpolyline) into a CSG.Path2D
//
function translatePath2D (obj, layers, options) {
  const closed = parseInt('00000000000000001', 2)

// expected values
  let vlen  = obj['vlen']
  let pptxs = obj['pptxs']
  let pptys = obj['pptys']
  let bulgs = obj['bulgs']
  let flags = obj['lflg']
  let name  = obj['name']
// translation
  let script = '  let ' + name + ' = new CSG.Path2D()\n'
  let isclosed = ((flags & closed) === 1)
  if (vlen === pptxs.length && vlen === pptys.length && vlen === bulgs.length) {
    script += '  ' + name + ' = ' + name
    pptxs.forEach(function(item, index, array) {
      let bulg = 0
      let px = 0
      let py = 0
      if (index > 0) {
        bulg = bulgs[index-1] // apply the previous bulg
        px = pptxs[index-1]
        py = pptys[index-1]
      }
      script = addSection(script, pptxs[index], pptys[index], bulg, px, py)
    })
  } else {
  // FIXME flag this DXF error
    return
  }
// FIXME add optional to create CAG from the path
  if (isclosed) {
  // apply the last section between last and first points
    let bulg = bulgs[vlen-1] // apply the previous bulg
    let px = pptxs[vlen-1]
    let py = pptys[vlen-1]
    script = addSection(script, pptxs[0], pptys[0], bulg, px, py)
    script += '\n  ' + name + ' = ' + name + '.close()\n'
    script += '  ' + name + ' = CAG.fromPoints(' + name + '.points)\n'
  } else {
    script += '\n'
  }
  obj['script'] = script
  addToLayer( obj,layers )
}

//
// translate the given object (arc) into CAG.Path2D or CSG??
//
function translateArc (obj, layers, colorindex) {
// expected values
  let lthk = obj['lthk']
  let pptx = obj['pptx']
  let ppty = obj['ppty']
  let pptz = obj['pptz']
  let swid = obj['swid']
  let ang0 = obj['ang0'] // start angle
  let ang1 = obj['ang1'] // end angle
  let name = obj['name']
// conversion
  if (lthk === 0.0) {
  // convert to 2D object
  // FIXME need to determine resolution from object/layer/variables
    let script = '  let ' + name + ' = CSG.Path2D.arc({center: [' + pptx + ',' + ppty + '],radius: ' + swid + ',startangle: ' + ang0 + ',endangle: ' + ang1 + ', resolution: CSG.defaultResolution2D})\n'
    obj['script'] = script
    addToLayer( obj,layers )
    return
  }
  // FIXME how to represent 3D arc?
}

//
// translate the given obj (circle) into CAG.circle (or extrude to CSG)
//
function translateCircle (obj, layers, colorindex) {
// expected values
  let lthk = obj['lthk']
  let pptx = obj['pptx']
  let ppty = obj['ppty']
  let pptz = obj['pptz']
  let swid = obj['swid']
  let name = obj['name']
// conversion
  // FIXME add color when supported
  //let cn = getColorNumber(obj,layers)
  //let shared = getColor(cn,colorindex)
  if (lthk === 0.0) {
  // convert to 2D object
  // FIXME need to determine resolution from object/layer/variables
    let script = '  let ' + name + ' = CAG.circle({center: [' + pptx + ',' + ppty + '],radius: ' + swid + ',resolution: CSG.defaultResolution2D})\n'
    obj['script'] = script
    addToLayer( obj,layers )
    return
  }
  // convert to 3D object
  // FIXME need to determine resolution from object/layer/variables
  let script = '  let ' + name + ' = CAG.circle({center: [' + pptx + ',' + ppty + '],radius: ' + swid + ',resolution: CSG.defaultResolution2D})'
  script += '.extrude({offset: [0,0,' + lthk + ']})\n'
  // FIXME need to use 210/220/230 for direction of rotation
  obj['script'] = script
  addToLayer( obj,layers )
}

//
// translate the given object (ellipse) into CAG.ellipse or CSG??
//
function translateEllipse (obj, layers, colorindex) {
// expected values
  let pptx = obj['pptx'] // center point
  let ppty = obj['ppty']
  let pptz = obj['pptz']
  let bulg = obj['bulg']
  let sptx = obj['sptx'] // MAJOR axis point (about center point)
  let spty = obj['spty']
  let sptz = obj['sptz']
  let swid = obj['swid'] // Ratio of minor axis to major axis
  let name = obj['name']
  if (pptz === 0.0 && sptz == 0.0) {
  // convert to 2D object
  // FIXME need to determine resolution from object/layer/variables
    let center = new CSG.Vector2D(pptx,ppty)
    let mjaxis = new CSG.Vector2D(sptx,spty)
    let rx = center.distanceTo(mjaxis)
    let ry = rx * swid
  // FIXME add start and end angle when supported
    let script = '  let ' + name + ' = CAG.ellipse({center: [' + pptx + ',' + ppty + '],radius: [' + rx + ',' + ry + '],resolution: CSG.defaultResolution2D})\n'
    if (ppty !== spty) {
    // FIXME need to apply rotation about Z
    }
    obj['script'] = script
    addToLayer( obj,layers )
    return
  }
  // convert to 3D object
}

function instantiateFaces(fvals) {
  let faces = []
  let vi = 0
  while (vi < fvals.length) {
    let fi = fvals[vi++]
    let face = []
    while (fi > 0) {
      face.push(fvals[vi++])
      fi--
    }
    faces.push(face)
  }
  return faces
}
function instantiatePoints(pptxs,pptys,pptzs) {
  let points = []
  let vi = 0
  while (vi < pptxs.length) {
    let x = pptxs[vi]
    let y = pptys[vi]
    let z = pptzs[vi]
    points.push([x,y,z])
    vi++
  }
  return points
}

//
// instantiate the MESH as an CSG object, consisting of the polygons given
//
// Note: See Face-Vertex meshes on Wikipedia
//
function instantiateMesh (obj, layers, colorindex) {
// expected values
  let vlen = obj['vlen']
  let pptxs = obj['pptxs'] // vertices
  let pptys = obj['pptys']
  let pptzs = obj['pptzs']

  let flen = obj['flen']
  let fvals = obj['fvals'] // faces

// conversion
  let cn = getColorNumber(obj,layers)
  let shared = getColor(cn,colorindex)

  CSG._CSGDEBUG = false

  let polygons = []
  if (vlen === pptxs.length && vlen === pptys.length && vlen === pptzs.length) {
    if (flen === fvals.length) {
      let faces  = instantiateFaces(fvals)
//console.log(faces)
      let points = instantiatePoints(pptxs,pptys,pptzs)
//console.log(points)

      let fi = 0
      while (fi < faces.length) {
        let face = faces[fi]
        let vectors  = []
        let vertices = [] // did i hear someone say REDUNDANCY
        let vi = 0
        while (vi < face.length) {
          let pi = face[vi]
          let vector = new CSG.Vector3D(points[pi])
          vectors.push(vector)
          let vertex = new CSG.Vertex(vector)
          vertices.push(vertex)
          vi++
        }
        let plane = CSG.Plane.fromVector3Ds(vectors[0],vectors[1],vectors[2])
//console.log("plane: "+plane.toString())
     // polygons need to be CCW rotation about the normal

        let normal = plane.normal
        let w1 = vectors[0]
        let w2 = vectors[1]
        let w3 = vectors[2]
        let e1 = w2.minus(w1)
        let e2 = w3.minus(w1)
        let t = new CSG.Vector3D(normal).dot(e1.cross(e2))
        if (t > 0) {    // 1,2,3 -> 3,2,1
//console.log('reverse')
          //vertices.reverse()
        }

        //let poly = CSG.Polygon.createFromPoints([p1,p2,p3],shared)
        let poly = new CSG.Polygon(vertices,shared)
        polygons.push( poly )

        fi++
      }
    } else {
    }
  } else {
  // invalid vlen
  }
  return CSG.fromPolygons(polygons)
}

function findLayer(obj, layers) {
  let lname = obj['lnam'] || '0'
// lookup the layer associated with the object
  for (let layer of layers) {
    if (layer['name'] === lname) {
      return layer
    }
  }
  return null
}

function findLayer0(layers) {
  for (let layer of layers) {
    if (layer['name'] === '0') {
      return layer
    }
  }
// this DXF did not specify so create
  layer = {type: 'layer', name: '0'}
  layer[getTLA(48)] = 1.0
  layer[getTLA(60)] = 0
  layer[getTLA(67)] = 0
  layer['objects'] = []

  layers.push(layer)
  return layer
}

function addToLayer(obj, layers) {
  let layer = findLayer(obj, layers)
  if (layer === null) {
  // hmmm... add to layer '0'
    layer = findLayer0(layers)
  }
  if (! ('objects' in layer)) {
    layer['objects'] = []
  }
  layer['objects'].push(obj)
}

//
// get the color number of the object, possibly looking at layer
// returns -1 if a color number was not found
//
function getColorNumber(obj,layers) {
  let cn = obj['cnmb'] || -1
  if (cn === BYLAYER) {
  // use the color number from the layer
    cn = -1
    let layer = findLayer(obj,layers)
    if (layer !== null) {
      cn = layer['cnmb'] || -1
    }
  } else
  if (cn === BYBLOCK) {
  // use the color number from the block
  }
  return cn
}

function mod(num, mod) {
  let remain = num % mod
  return Math.floor(remain >= 0 ? remain : remain + mod)
}

//
// instantiate Polygon.Shared(color) using the given index into the given color index
//
function getColor(index,colorindex) {
  if (index < 0) { return null }

  index = mod(index,colorindex.length)
  let rgba = colorindex[index]
// FIXME : colors should be cached and shared
  return new CSG.Polygon.Shared(rgba)
}

// works for both POLYLINE
function getPolyType(obj) {
  const closed = parseInt('00000000000000001', 2)
  const d3line = parseInt('00000000000001000', 2)
  const d3mesh = parseInt('00000000000010000', 2)

  let flags = obj['lflg']
  let ptype = null
  if ((flags & d3line) == 1) {
    ptype = null // FIXME what to do?
  } else
  if ((flags & d3mesh) == 1) {
    ptype = new CSG()
  } else {
    let isclosed = ((flags & closed) === 1)
    ptype = new CSG.Path2D([],isclosed)
  }
  return ptype
}

function translatePlane(plane) {
  let script = 'new CSG.Plane(' + translateVector3D(plane.normal) + ',' + plane.w + ')'
  return script
}

function translateShared(shared) {
  let script = 'CSG.Polygon.defaultShared'
  if (shared !== null && shared.color !== null) {
    script = 'new CSG.Polygon.Shared([0, 0, 0, 1])'
  }
  return script
}

function translateVertex(vertex) {
  let script = 'new CSG.Vertex('
  script += translateVector3D(vertex.pos)
  script += ')'
  return script
}

// translate a complex object from the given base object and parts
// - a series of 3dface => polygons => CSG
// - a series of vertex => vectors => Path2D
//
function translateCurrent(objects,baseobj,polygons,vectors) {
  if (baseobj instanceof CSG.Path2D) {
console.log('##### completing Path2D')
    script += "const path = new CSG.Path2D()\n"
    //objects.push( new CSG.Path2D(vectors, baseobj.closed) )
  }
  if (baseobj instanceof CSG) {
console.log('##### completing CSG')
    let script = "function csg1() {\n"
    script += "  const polygons = [\n"
    for (let polygon of polygons) {
      script += '  ' + polygon + ','
    }
    script += "\n  ]\n"
    script += "  return new CSG(polygons)\n"
    script += "}\n"
    objects.push( script )
  }
  return null
}

//
// translate the given layer into a wrapper function for the previous translated objects
//
function translateLayer(layer) {
  let name = layer['name'] || 'Unknown'
  let script = "function layer" + name + "() {\n"
  for (let object of layer['objects']) {
    script += object['script']
  }
  script += "  return ["
  for (let object of layer['objects']) {
    script += object['name']
  }
  script += "]\n}\n"
  return script
}

const translateAsciiDxf = function (reader, options) {
console.log('**************************************************')
console.log(JSON.stringify(reader.objstack))
console.log('**************************************************')

  let layers   = []   // list of layers with various information like color
  let current  = null // the object being created
  let polygons = []   // the list of 3D polygons translated
  let objects  = []   // the list of objects translated
  let vectors  = []   // the list of vectors translated

  let p = null
  for (let obj of reader.objstack) {
    p = null

    if (! ('type' in obj)) {
      //console.log('##### skip')
      continue
    }
    if (! ('name' in obj)) {
      obj['name'] = 'jscad' + objects.length
    }

    switch (obj.type) {
//console.log(JSON.stringify(obj))
    // control objects
      case 'dxf':
        break
      case 'layer':
console.log('##### layer')
        current = translateCurrent(objects,current,polygons,vectors)
        layers.push(obj)
        break
      case 'variable':
        current = translateCurrent(objects,current,polygons,vectors)
        break

    // 3D entities
      case '3dface':
console.log('##### 3dface')
        p = translatePolygon(obj,layers,options.colorindex)
        if (current === null) {
console.log('##### start of 3dfaces CSG')
          current = new CSG()
        }
        break
      case 'mesh':
console.log('##### mesh')
        current = translateCurrent(objects,current,polygons,vectors)
        objects.push( instantiateMesh(obj,layers,options.colorindex) )
        break

    // 2D or 3D entities
      case 'arc':
console.log('##### arc')
        current = translateCurrent(objects,current,polygons,vectors)
        translateArc(obj,layers,options.colorindex)
        break
      case 'circle':
console.log('##### circle')
        current = translateCurrent(objects,current,polygons,vectors)
        translateCircle(obj,layers,options.colorindex)
        break
      case 'ellipse':
console.log('##### ellipse')
        current = translateCurrent(objects,current,polygons,vectors)
        translateEllipse(obj,layers,options.colorindex)
        break
      case 'line':
console.log('##### line')
        current = translateCurrent(objects,current,polygons,vectors)
        translateLine(obj,layers,options.colorindex)
        break
      case 'polyline':
        if (current === null) {
console.log('##### start of polyline')
          current = getPolyType(obj)
        }
        break
      case 'vertex':
console.log('##### vertex')
        p = instantiateVertex(obj)
        break
      case 'seqend':
        current = translateCurrent(objects,current,polygons,vectors)
        break

    // 2D entities
      case 'lwpolyline':
console.log('##### lwpolyline')
        current = translateCurrent(objects,current,polygons,vectors)
        translatePath2D(obj,layers,options)
        break

      default:
console.log('##### ERROR')
console.log(obj.type)
        break
    }
  // accumlate polygons if necessary
    if (p !== null & current instanceof CSG) {
      polygons.push(p)
    }
  // accumlate vectors if necessary
    if (p !== null & current instanceof CSG.Path2D) {
      vectors.push(p)
    }
    if (p !== null & current instanceof CSG.Path2D) {
      vectors.push(p)
    }
  }
// translate the last object if necessary
  current = translateCurrent(objects,current,polygons,vectors)

// debug output
console.log('**************************************************')
  let script = ''
  layers.forEach(
    function(layer) {
      script += translateLayer(layer)
      //script += "\n"
    }
  )
console.log(script)
console.log('**************************************************')
  return script
}

module.exports = translateAsciiDxf

