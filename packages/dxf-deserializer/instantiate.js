/*
## License

Copyright (c) 2017 Z3 Development https://github.com/z3dev

All code released under MIT license

*/
const { CSG, CAG } = require('@jscad/csg')

const {BYBLOCK, BYLAYER} = require('./autocad')

// return Polygon
//
function instantiatePolygon (obj,layers,colorindex) {
  let vertices = []
// FIXME: should check global variable to instantiate in the proper orientation
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
  return new CSG.Polygon(vertices,shared)
}

// return Line3D
//
function instantiateLine3D (obj) {
  let p1 = new CSG.Vector3D( [obj['pptx'],obj['ppty'],obj['pptz']] )
  let p2 = new CSG.Vector3D( [obj['sptx'],obj['spty'],obj['sptz']] )
  return CSG.Line3D.fromPoints(p1, p2)
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
// append a section to the given path
//
function addSection(path,x1,y1,bulg) {
  if (bulg === 0) {
  // add straight line to the end of the path
    path = path.appendPoint( [x1, y1] )
  } else {
  // add arc to the end of the path
    let prev   = path.points[path.points.length-1]
    let x0 = prev.x
    let y0 = prev.y
    let curr = new CSG.Vector2D(x1,y1)
//console.log("bulg: ["+x0+","+y0+"],["+x1+","+y1+"],"+bulg)
    let u = prev.distanceTo(curr)
    let r = u * ((1 + Math.pow(bulg,2)) / (4 * bulg))
    let clockwise = (bulg < 0)
    let large     = false // FIXME how to determine?
    let d = Math.atan(bulg) / (Math.PI/180) * 4
//console.log("u: "+u+", r: "+r+", cw: "+clockwise+", d: "+d)
    path = path.appendArc([x1,y1],{radius: r,xaxisrotation: d,clockwise: clockwise,large: large});
  }
  return path
}

//
// convert the given obj (lwpolyline) into a path
//
function instantiatePath2D (obj, layers) {
  const closed = parseInt('00000000000000001', 2)

//console.log(JSON.stringify(obj));

// expected values
  let vlen  = obj['vlen']
  let pptxs = obj['pptxs']
  let pptys = obj['pptys']
  let bulgs = obj['bulgs']
  let flags = obj['lflg']
// conversion
  let path = new CSG.Path2D()
  let isclosed = ((flags & closed) === 1)
  if (vlen === pptxs.length && vlen === pptys.length && vlen === bulgs.length) {
    pptxs.forEach(function(item, index, array) {
      let bulg = 0
      if (index > 0) {
        bulg = bulgs[index-1] // apply the previous bulg
      }
      path = addSection(path, pptxs[index], pptys[index], bulg)
    });
  } else {
  // FIXME flag this DXF error
    return path
  }
// FIXME add optional to create CAG from the path
  if (isclosed) {
  // apply the last section between last and first points
    path = addSection(path, pptxs[0], pptys[0], bulgs[bulgs.length-1])
    path = path.close()
    return CAG.fromPoints(path.points)
  }
  return path
}

//
// convert the given obj (arc) into CAG or CSG
//
function instantiateArc (obj, layers, colorindex) {
// expected values
  let lthk = obj['lthk']
  let pptx = obj['pptx']
  let ppty = obj['ppty']
  let pptz = obj['pptz']
  let swid = obj['swid']
  let ang0 = obj['ang0'] // start angle
  let ang1 = obj['ang1'] // end angle
// conversion
  if (lthk === 0.0) {
  // convert to 2D object
  // FIXME need to determine resolution from object/layer/variables
    return CSG.Path2D.arc({center: [pptx,ppty],radius: swid,startangle: ang0,endangle: ang1, resolution: CSG.defaultResolution2D})
  }
  // FIXME how to represent 3D arc?
  return CSG.Path2D.arc({center: [pptx,ppty],radius: swid,startangle: ang0,endangle: ang1, resolution: CSG.defaultResolution2D})
}

//
// convert the given obj (circle) into CAG or CSG
//
function instantiateCircle (obj, layers, colorindex) {
// expected values
  let lthk = obj['lthk']
  let pptx = obj['pptx']
  let ppty = obj['ppty']
  let pptz = obj['pptz']
  let swid = obj['swid']
// conversion
  let cn = getColorNumber(obj,layers)
  let shared = getColor(cn,colorindex)
  if (lthk === 0.0) {
  // convert to 2D object
  // FIXME need to determine resolution from object/layer/variables
    return new CAG.circle({center: [pptx,ppty],radius: swid,resolution: CSG.defaultResolution2D})
  }
  // convert to 3D object
  // FIXME need to determine resolution from object/layer/variables
  // FIXME need to use 210/220/230 for direction of extrusion
  let x = pptx
  let y = ppty
  let z = pptz + swid
  return new CAG.cylinder({start: [pptx,ppty,pptz],end: [x,y,z],radius: swid,resolution: CSG.defaultResolution3D})
}

function createEdges(vlen, faces) {
  let edges = []
  while (vlen > 0) {
    edges.push([])
    vlen--
  }
  let mod3 = Math.floor(faces.length / 3) * 3
  if (mod3 === faces.length) {
    let fi = 0
    while (fi < faces.length) {
      let v1 = faces[fi++]
      let v2 = faces[fi++]
      let v3 = faces[fi++]
      if (v1 === v2 || v1 === v3 || v2 === v3) continue

      let edge = edges[v1]
      if (edge.indexOf(v2) < 0) { edge.push(v2) }
      if (edge.indexOf(v3) < 0) { edge.push(v3) }

      edge = edges[v2]
      if (edge.indexOf(v3) < 0) { edge.push(v3) }
      if (edge.indexOf(v1) < 0) { edge.push(v1) }

      edge = edges[v3]
      if (edge.indexOf(v1) < 0) { edge.push(v1) }
      if (edge.indexOf(v2) < 0) { edge.push(v2) }
    }
  }
  return edges
}
function createFaces(edgesByVertex) {
  let v1 = edgesByVertex.length
  let faces = []
  while (v1 > 0) {
    v1--
    let v1edges = edgesByVertex[v1]
    let e1i = v1edges.length
    while (e1i > 0) {
      e1i--
      let v2 = v1edges[e1i]
      let v2edges = edgesByVertex[v2]
    // search for common vertexes
      let e2i = v2edges.length
      while (e2i > 0) {
        e2i--
        let v3 = v2edges[e2i]
        if (v1edges.indexOf(v3) < 0) continue
      // save this face
        faces.push([v1,v2,v3])
      }
    }
  }
  return faces
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
/*
        let v1 = fvals[fi++]
        let v2 = fvals[fi++]
        let v3 = fvals[fi++]
//console.log('Vs: '+v1+','+v2+','+v3)
        if (v1 === v2 || v1 === v3 || v2 === v3) continue
        let p1 = new CSG.Vector3D([pptxs[v1],pptys[v1],pptzs[v1]])
        let p2 = new CSG.Vector3D([pptxs[v2],pptys[v2],pptzs[v2]])
        let p3 = new CSG.Vector3D([pptxs[v3],pptys[v3],pptzs[v3]])
    // check for CW vs CCW polygons
        let plane = CSG.Plane.fromVector3Ds(p1,p2,p3)
//console.log("plane: "+plane.toString())
        let normal = plane.normal
        if (isNaN(normal.x)) continue
//console.log("normal: "+normal.toString())

      let w1 = new CSG.Vector3D(p1)
      let w2 = new CSG.Vector3D(p2)
      let w3 = new CSG.Vector3D(p3)
      let e1 = w2.minus(w1)
      let e2 = w3.minus(w1)
      let t = new CSG.Vector3D(normal).dot(e1.cross(e2))
      if (t > 0) {    // 1,2,3 -> 3,2,1
//console.log('reverse')
        let tmp = p1
        p1 = p3
        p3 = tmp
      }
      let poly = CSG.Polygon.createFromPoints([p1,p2,p3],shared,plane)
      }
        let poly = CSG.Polygon.createFromPoints([p1,p2,p3],shared)
//console.log("polygon: "+poly.toString())
        //let c = poly.checkIfConvex()
//console.log("poly convex: "+c)
*/
    } else {
    }
  } else {
  // invalid vlen
  }
  return CSG.fromPolygons(polygons)
}

function findLayer(obj, layers) {
  let lname = obj['lnam'] || '0'
  for (let layer of layers) {
    if (layer['name'] === lname) {
      return layer
    }
  }
  return null
}

// get the color number of the object, possibly looking at layer
// returns -1 if a color number was not found
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
  let remain = num % mod;
  return Math.floor(remain >= 0 ? remain : remain + mod);
}

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
    let isclosed = ((flags & closed) === 1);
    ptype = new CSG.Path2D([],isclosed);
  }
  return ptype
}

function completeCurrent(objects,baseobj,polygons,vectors) {
  if (baseobj instanceof CSG.Path2D) {
console.log('##### completing Path2D')
    objects.push( new CSG.Path2D(vectors, baseobj.closed) )
  }
  if (baseobj instanceof CSG) {
console.log('##### completing CSG')
    objects.push( CSG.fromPolygons(polygons) )
  }
  return null
}

const instantiateAsciiDxf = function (reader, options) {
console.log('**************************************************')
//console.log(JSON.stringify(reader.objstack));
//console.log('**************************************************')

  let layers   = []   // list of layers with various information like color
  let current  = null // the object being created
  let polygons = []   // the list of 3D polygons
  let objects  = []   // the list of objects instantiated
  let vectors  = []   // the list of vectors for paths or meshes

  let p = null
  for (let obj of reader.objstack) {
    p = null

    if (! ('type' in obj)) {
      //console.log('##### skip')
      continue
    }

    switch (obj.type) {
//console.log(JSON.stringify(obj));
      case 'dxf':
        break
      case 'layer':
console.log('##### layer')
        current = completeCurrent(objects,current,polygons,vectors)
        layers.push(obj)
        break
      case 'variable':
        current = completeCurrent(objects,current,polygons,vectors)
        break

    // 3D entities
      case '3dface':
console.log('##### 3dface')
        p = instantiatePolygon(obj,layers,options.colorindex)
        if (current === null) {
console.log('##### start of 3dfaces CSG')
          current = new CSG()
        }
        break
      case 'mesh':
console.log('##### mesh')
        current = completeCurrent(objects,current,polygons,vectors)
        objects.push( instantiateMesh(obj,layers,options.colorindex) )
        break

    // 2D or 3D entities
      case 'arc':
console.log('##### arc')
        current = completeCurrent(objects,current,polygons,vectors)
        objects.push( instantiateArc(obj,layers,options.colorindex) )
        break
      case 'circle':
console.log('##### circle')
        current = completeCurrent(objects,current,polygons,vectors)
        objects.push( instantiateCircle(obj,layers,options.colorindex) )
        break
      case 'ellipse':
console.log('##### ellipse')
        current = completeCurrent(objects,current,polygons,vectors)
        //objects.push( instantiateCircle(obj,layers,options.colorindex) )
        break
      case 'line':
console.log('##### line')
        current = completeCurrent(objects,current,polygons,vectors)
        objects.push( instantiateLine3D(obj) )
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
        current = completeCurrent(objects,current,polygons,vectors)
        break

    // 2D entities
      case 'lwpolyline':
console.log('##### lwpolyline')
        current = completeCurrent(objects,current,polygons,vectors)
        objects.push( instantiatePath2D(obj,layers) )
        break

      default:
console.log('##### ERROR')
console.log(obj.type)
        break
    }
  // accumlate polygons if necessary
    if (p instanceof CSG.Polygon) {
      polygons.push(p)
    }
  // accumlate vectors if necessary
    if (p instanceof CSG.Vector3D) {
      vectors.push(p)
    }
    if (p instanceof CSG.Vector2D) {
      vectors.push(p)
    }
  }
// instantiate the last object if necessary
  current = completeCurrent(objects,current,polygons,vectors)
// add accumulated objects

// debug output
//console.log('**************************************************')
//  objects.forEach(
//    function(e) {
//      console.log(JSON.stringify(e));
//    }
//  );
//console.log('**************************************************')
  return objects
}

module.exports = instantiateAsciiDxf

