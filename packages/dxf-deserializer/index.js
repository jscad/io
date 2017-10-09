/*
## License

Copyright (c) 2017 Z3 Development https://github.com/z3dev

All code released under MIT license

*/

const { CSG, CAG } = require('@jscad/csg')

const {colorIndex, BYBLOCK, BYLAYER} = require('./autocad')
const dxf = require('./DxfReader')

// //////////////////////////////////////////
//
// DXF (Drawing Exchange Format) is a CAD data file format developed by Autodesk
// See http://www.autodesk.com/techpubs/autocad/dxf/
//
// //////////////////////////////////////////

//
// translate group codes to names for internal use
//
let dxfTLA = [
    [0  ,'etyp'], [1 ,'text'], [2 ,'name'], [3 ,'nam1'],
    [5  ,'hdle'], [6 ,'ltyp'], [7 ,'lsty'], [8 ,'lnam'], [9 ,'vari'],
    [10 ,'pptx'], [11,'sptx'], [12,'tptx'], [13,'fptx'],
    [20 ,'ppty'], [21,'spty'], [22,'tpty'], [23,'fpty'],
    [30 ,'pptz'], [31,'sptz'], [32,'tptz'], [33,'fptz'],
    [38, 'elev'], [39 ,'lthk'],
    [40 ,'swid'], [41,'ewid'], [42,'bulg'], [43,'cwid'],
    [48 ,'lscl'],
    [50 ,'ang0'], [51,'ang1'],
    [60 ,'visb'], [62,'cnmb'],
    [67 ,'spac'],
    [70 ,'lflg'], [71,'fvia'], [72,'fvib'], [73,'fvic'], [74,'fvid'],
    [75 ,'cflg'],
    [90 ,'vlen'], [91,'slen'], [92,'plen'], [93,'flen'], [94,'elen'],
    [95 ,'clen'],
    [100,'sbnm'],
    [210,'etrx'],
    [220,'etry'],
    [230,'etrz'],
  ];

let dxfMap = new Map(dxfTLA)

function getTLA (group) {
  return dxfMap.get(group)
}


function handleError(e) {
  console.log('error: line ' + e.line + ', column ' + e.column + ', bad character [' + e.c + ']')
}
function handleStart(reader,data) {
  console.log('DXF reader started');
}
function handleEnd(reader,data) {
  console.log('DXF reader completed');
}

// Common Group Codes per Entity
function handleEntity(reader,group,value) {
  //console.log('entity: '+group+','+value);

  let obj = null
  switch (value) {
    case 'LAYER':
      obj = {type: 'layer'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      //obj[getTLA(62)] = 256
      obj[getTLA(67)] = 0
    // layer defaults
      reader.objstack.push(obj)
      break
    case 'LINE':
      obj = {type: 'line'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // line defaults
      obj[getTLA(210)] = 0
      obj[getTLA(220)] = 0
      obj[getTLA(230)] = 0

      reader.objstack.push(obj)
      break
    case 'LWPOLYLINE':
      obj = {type: 'lwpolyline'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // lwpolyline defaults
      obj[getTLA(38)] = 0
      obj[getTLA(39)] = 0
      obj[getTLA(43)] = 0
      obj[getTLA(70)] = 0
      obj[getTLA(90)] = 0
      obj[getTLA(210)] = 0
      obj[getTLA(220)] = 0
      obj[getTLA(230)] = 1

      reader.objstack.push(obj)
      break
    case 'MESH':
      obj = {type: 'mesh'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0

      obj[getTLA(91)] = 0 // initialize lengths
      obj[getTLA(92)] = 0
      obj[getTLA(93)] = 0
      obj[getTLA(94)] = 0
      obj[getTLA(95)] = 0
      obj['state'] = 0 // keep a state
      reader.objstack.push(obj)
      break
    case 'POLYLINE':
      obj = {type: 'polyline'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // polyline defaults
      obj[getTLA(10)] = 0
      obj[getTLA(20)] = 0
      obj[getTLA(30)] = 0
      obj[getTLA(39)] = 0
      obj[getTLA(40)] = 0
      obj[getTLA(41)] = 0
      obj[getTLA(70)] = 0
      obj[getTLA(71)] = 0
      obj[getTLA(72)] = 0
      obj[getTLA(73)] = 0
      obj[getTLA(74)] = 0
      obj[getTLA(75)] = 0
      obj[getTLA(210)] = 0
      obj[getTLA(220)] = 0
      obj[getTLA(230)] = 1

      reader.objstack.push(obj)
      break
    case 'ARC':
      obj = {type: 'arc'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // arc defaults
      obj[getTLA(39)] = 0
      obj[getTLA(210)] = 0
      obj[getTLA(220)] = 0
      obj[getTLA(230)] = 1

      reader.objstack.push(obj)
      break
    case 'CIRCLE':
      obj = {type: 'circle'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // circle defaults
      obj[getTLA(39)] = 0
      obj[getTLA(210)] = 0
      obj[getTLA(220)] = 0
      obj[getTLA(230)] = 1

      reader.objstack.push(obj)
      break
    case 'ELLIPSE':
      obj = {type: 'ellipse'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // ellipse defaults
      obj[getTLA(210)] = 0
      obj[getTLA(220)] = 0
      obj[getTLA(230)] = 1

      reader.objstack.push(obj)
      break
    case 'VERTEX':
      obj = {type: 'vertex'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // vertex defaults
      obj[getTLA(10)] = 0
      obj[getTLA(20)] = 0
      obj[getTLA(30)] = 0
      obj[getTLA(40)] = 0
      obj[getTLA(41)] = 0
      obj[getTLA(42)] = 0
      obj[getTLA(70)] = 0

      reader.objstack.push(obj)
      break
    case '3DFACE':
      obj = {type: '3dface'}
    // entity defaults
      obj[getTLA(48)] = 1.0
      obj[getTLA(60)] = 0
      obj[getTLA(62)] = BYLAYER
      obj[getTLA(67)] = 0
    // face defaults
      obj[getTLA(70)] = 0

      reader.objstack.push(obj)
      break
    case 'SEQEND':
      obj = {type: 'seqend'}
      reader.objstack.push(obj)
      break
    default:
    // push on an anonymous object which does not have attributes / values
      obj = {}
      reader.objstack.push(obj)
      //console.log('WARNING: Unknown DXF entity: '+value)
      break
  }
}

function handleVarible(reader,group,value) {
  //console.log('variable: '+group+','+value)
  let obj = {type: 'variable', name: value}
  reader.objstack.push(obj)
}

function handleInt(reader,group,value) {
  //console.log('int: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    obj[getTLA(group)] = parseFloat(value)
  }
  reader.objstack.push(obj)
}

function handleDouble(reader,group,value) {
  //console.log('double: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    obj[getTLA(group)] = parseFloat(value)
  }
  reader.objstack.push(obj)
}

function handleXcoord(reader,group,value) {
  //console.log('xcoord: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj['type'] === 'lwpolyline') {
    // special handling to build a list of vertices
      if (obj['pptxs'] === undefined) {
        obj['pptxs'] = []
        obj['bulgs'] = []
      }
      obj['pptxs'].push(parseFloat(value))
      obj['bulgs'].push(0)
    } else {
      if (obj['type'] === 'mesh') {
      // special handling to build a list of vertices
        if (obj['pptxs'] === undefined) {
          obj['pptxs'] = []
        }
        obj['pptxs'].push(parseFloat(value))
      } else {
        obj[getTLA(group)] = parseFloat(value)
      }
    }
  }
  reader.objstack.push(obj)
}

function handleYcoord(reader,group,value) {
  //console.log('ycoord: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj['type'] === 'lwpolyline' || obj['type'] === 'mesh') {
    // special handling to build a list of vertices
      if (obj['pptys'] === undefined) {
        obj['pptys'] = []
      }
      obj['pptys'].push(parseFloat(value))
    } else {
      obj[getTLA(group)] = parseFloat(value)
    }
  }
  reader.objstack.push(obj)
}

function handleZcoord(reader,group,value) {
  //console.log('ycoord: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj['type'] === 'mesh') {
    // special handling to build a list of vertices
      if (obj['pptzs'] === undefined) {
        obj['pptzs'] = []
      }
      obj['pptzs'].push(parseFloat(value))
    } else {
      obj[getTLA(group)] = parseFloat(value)
    }
  }
  reader.objstack.push(obj)
}

function handleBulge(reader,group,value) {
  //console.log('bulg: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj['type'] === 'lwpolyline') {
    // special handling to build a list of vertices
      let bulgs = obj['bulgs']
      if (bulgs !== undefined) {
        let pptxs = obj['pptxs']
        if (pptxs.length === bulgs.length) {
          bulgs[bulgs.length-1] = parseFloat(value)
        }
      }
    } else {
      obj[getTLA(group)] = parseFloat(value)
    }
  }
  reader.objstack.push(obj)
}

function handleLen(reader,group,value) {
  //console.log('len: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj['type'] === 'mesh') {
    // mesh has an order of lengths
      let state = obj['state']
      //console.log('mesh len: '+group+','+value+','+state)
      switch (group) {
        case 91: // length of subdivisions
          obj[getTLA(group)] = parseFloat(value)
          obj['state'] = 1
          break;
        case 92: // vertex count OR overriden property count
          if (state === 1) {
            obj['vlen'] = parseFloat(value) // override attribute
            obj['state'] = 2
          } else {
            obj['plen'] = parseFloat(value) // override attribute
            obj['state'] = 6
          }
          break;
        case 93: // face count
          obj[getTLA(group)] = parseFloat(value)
          obj['state'] = 3
          break;
        case 94: // edge count
          obj[getTLA(group)] = parseFloat(value)
          obj['state'] = 4
          break;
        case 95: // edge crease count
          obj[getTLA(group)] = parseFloat(value)
          obj['state'] = 5
          break;
        default:
          obj['state'] = 7
          break;
      }
    } else {
      obj[getTLA(group)] = parseFloat(value)
    }
  }
  reader.objstack.push(obj)
}

//
// special handling of group 90 (aaa) for various mesh values
//
function handleValue(reader,group,value) {
  //console.log('int: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj['type'] === 'mesh') {
      let state = obj['state']
      //console.log('mesh value: '+group+','+value+','+state)
    // mesh has an order of values based on state
      switch (state) {
        case 3: // accumulate face values
          if (obj['fvals'] === undefined) {
            obj['fvals'] = []
          }
          obj['fvals'].push(parseFloat(value))
          break
        case 4: // accumulate edge values
          if (obj['evals'] === undefined) {
            obj['evals'] = []
          }
          obj['evals'].push(parseFloat(value))
          break
        default:
          break
      }
    } else {
      obj[getTLA(group)] = parseFloat(value)
    }
  }
  reader.objstack.push(obj)
}

function handleString(reader,group,value) {
  //console.log('string: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    obj[getTLA(group)] = value
  }
  reader.objstack.push(obj)
}

function handleName(reader,group,value) {
  //console.log('name: '+group+','+value)
  let obj = reader.objstack.pop()
  if ('type' in obj) {
    if (obj[getTLA(group)] === undefined) {
      obj[getTLA(group)] = value
    }
  }
  reader.objstack.push(obj)
}

function createReader(src, options) {
// create a reader for the DXF
  let reader = dxf.reader(options)
// setup event handling from the reader
  reader.on('error',handleError)
  reader.on('start',handleStart)
  reader.on('end'  ,handleEnd)

// setup group handling
  reader.absorb(0,handleEntity)
  reader.absorb(1,handleString)
  reader.absorb(2,handleName)
  reader.absorb(3,handleName)
  reader.absorb(6,handleString)
  reader.absorb(7,handleString)
  reader.absorb(8,handleString)
  reader.absorb(9,handleVarible)
  reader.absorb(10,handleXcoord)
  reader.absorb(11,handleDouble)
  reader.absorb(12,handleDouble)
  reader.absorb(13,handleDouble)
  reader.absorb(20,handleYcoord)
  reader.absorb(21,handleDouble)
  reader.absorb(22,handleDouble)
  reader.absorb(23,handleDouble)
  reader.absorb(30,handleZcoord)
  reader.absorb(31,handleDouble)
  reader.absorb(32,handleDouble)
  reader.absorb(33,handleDouble)
  reader.absorb(39,handleDouble)
  reader.absorb(40,handleDouble)
  reader.absorb(41,handleDouble)
  reader.absorb(42,handleBulge)
  reader.absorb(50,handleDouble)
  reader.absorb(51,handleDouble)
  reader.absorb(62,handleInt)
  reader.absorb(70,handleInt)
  reader.absorb(71,handleInt)
  reader.absorb(72,handleInt)
  reader.absorb(73,handleInt)
  reader.absorb(74,handleInt)
  reader.absorb(75,handleInt)
  reader.absorb(90,handleValue)
  reader.absorb(91,handleLen) // MESH
  reader.absorb(92,handleLen) // MESH
  reader.absorb(93,handleLen) // MESH
  reader.absorb(94,handleLen) // MESH
  reader.absorb(95,handleLen) // MESH
  reader.absorb(210,handleInt)
  reader.absorb(220,handleInt)
  reader.absorb(230,handleInt)

// initial state
  reader.objstack = []
  reader.objstack.push({type: 'dxf'})
// start the reader
  reader.write(src).close()
  return reader
}

// create color map
// - set all to default color of openjscad

// create variables
// - scale is default to 1.00
// - important variables from DXF

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
  var remain = num % mod;
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

function instantiateAsciiDxf (src, options) {
  let reader = createReader(src, options)
console.log('**************************************************')
console.log(JSON.stringify(reader.objstack));
console.log('**************************************************')

  let layers   = []   // list of layers with various information like color
  let current  = null // the object being created
  let polygons = []   // the list of 3D polygons
  let objects  = []   // the list of objects instantiated
  let vectors  = []   // the list of vectors for paths or meshes

  var p = null
  for (let obj of reader.objstack) {
    p = null

    if (! ('type' in obj)) {
      //console.log('##### skip')
      continue
    }

    switch (obj.type) {
//console.log(JSON.stringify(obj));
      case 'layer':
console.log('##### layer')
        layers.push(obj)
        break

    // 3D entities
      case '3dface':
console.log('##### 3dface')
        p = instantiatePolygon(obj,layers,options.colorindex)
        if (current === null) { current = new CSG() }
        break
      case 'mesh':
console.log('##### mesh')
        break

    // 2D or 3D entities
      case 'arc':
console.log('##### arc')
        objects.push( instantiateArc(obj,layers,options.colorindex) )
        break
      case 'circle':
console.log('##### circle')
        objects.push( instantiateCircle(obj,layers,options.colorindex) )
        break
      case 'ellipse':
console.log('##### ellipse')
        //objects.push( instantiateCircle(obj,layers,options.colorindex) )
        break
      case 'line':
console.log('##### line')
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
        if (current !== null) {
          if (current instanceof CSG.Path2D) {
console.log('##### instantiateing Path2D of '+current)
            objects.push( new CSG.Path2D( vectors, current.closed ) )
          }
          current = null
        }
        break

    // 2D entities
      case 'lwpolyline':
console.log('##### lwpolyline')
        objects.push( instantiatePath2D(obj,layers) )
        break

      default:
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
  if (current instanceof CSG) {
    objects.push( CSG.fromPolygons(polygons) )
  }
// add accumulated objects

// debug output
console.log('**************************************************')
  objects.forEach(
    function(e) {
      console.log(JSON.stringify(e));
    }
  );
console.log('**************************************************')
  return objects
}

/*
 * Options
 * - colorIndex list of colors for use rendering, default AutoCad.colorIndex
 */
function instantiate (src, fn, options) {
  options = options || {}
  options.colorindex = options.colorindex || colorIndex

  // FIXME handle both ASCII and BINARY
  var objs = instantiateAsciiDxf(src, options)
  return objs
}

// Options:
//
function translate (src, filename, options) {
  var code = ''
  var n = 0
  var converted = 0
  var o

  code += '// producer: OpenJSCAD Compatibility (' + options.version + ') DXF ASCII Importer\n'
  code += '// date: ' + (new Date()) + '\n'
  code += '// source: ' + filename + '\n'
  code += '\n'
// create a table of colors if necessary
// create a function for each layer that returns a list of objects (entities)
  code += 'function main() { return union(\n'
// return a list of layers
  code += '); }\n'
  return code
}

/**
 * Deserialize the given source and return the requested 'output'
 * @param  {string} DXF data stream
 * @param  {string} filename (optional) original filename of DXF data stream if any
 * @param  {object} options (optional) anonymous object with:
 *  output {string} type of output to produce, either 'jscad' script or 'csg' objects
 *  strict {boolean} obey strict DXF specifications
 *  colorindex {array} list of 256 colors
 */
const deserialize = function (src, filename, options) {
  const defaults = {
    output : 'jscad',
    version: '0.0.0'
  }
  options = Object.assign({}, defaults, options)
  return options.output === 'jscad' ? translate(src, filename, options) : instantiate(src, filename, options)
}

module.exports = {
  deserialize
}
