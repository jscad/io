/*
## License

Copyright (c) 2016 Z3 Development https://github.com/z3dev
2017 Mark 'kaosat-dev' Moissette

Refactor and upgrades sponsored by ***

All code released under MIT license
*/

const sax = require('sax')
const {CAG} = require('@jscad/csg')

const {cagLengthX, cagLengthY} = require('./helpers')
const {svgTransforms, svgCore, svgPresentation, svgSvg, svgRect, svgCircle, svgGroup, svgLine, svgPath, svgEllipse, svgPolygon, svgPolyline} = require('./svgElementHelpers')

let svgUnitsX
let svgUnitsY
let svgUnitsV

// generate GROUP with attributes from USE element
// - except X,Y,HEIGHT,WIDTH,XLINK:HREF
// - append translate(x,y) if X,Y available
// deep clone the referenced OBJECT and add to group
// - clone using JSON.parse(JSON.stringify(obj))
const svgUse = function (element) {
  var obj = {type: 'group'}
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)

  if ('X' in element && 'Y' in element) {
    if (!('transforms' in obj)) obj.transforms = []
    var o = {translate: [element.X, element.Y]}
    obj.transforms.push(o)
  }

  obj.objects = []
  if ('XLINK:HREF' in element) {
  // lookup the named object
    var ref = element['XLINK:HREF']
    if (ref[0] === '#') { ref = ref.slice(1, ref.length) }
    if (svgObjects[ref] !== undefined) {
      ref = svgObjects[ref]
      ref = JSON.parse(JSON.stringify(ref))
      obj.objects.push(ref)
    }
  }
  return obj
}

// processing controls
let svgObjects = []    // named objects
let svgGroups = []    // groups of objects
let svgInDefs = false // svg DEFS element in process
let svgObj = null  // svg in object form
let svgUnitsPmm = [1, 1]
let svgUnitsPer = 0

let rootObject = new CAG()

const codify = function (group) {
  const level = svgGroups.length
  // add this group to the heiarchy
  svgGroups.push(group)
  // create an indent for the generated code
  let i = level
  while (i > 0) {
    i--
  }

  let lnCAG = new CAG()

  const params = {
    svgUnitsPmm,
    svgUnitsX,
    svgUnitsY,
    svgUnitsV,
    level,
    svgGroups
  }
  // generate code for all objects
  for (i = 0; i < group.objects.length; i++) {
    const obj = group.objects[i]
    let onCAG = require('./shapesMapCsg')(obj, codify, params)

    if ('fill' in obj) {
    // FIXME when CAG supports color
    //  code += indent+on+' = '+on+'.setColor(['+obj.fill[0]+','+obj.fill[1]+','+obj.fill[2]+']);\n';
    }
    if ('transforms' in obj) {
      // NOTE: SVG specifications require that transforms are applied in the order given.
      // But these are applied in the order as required by CSG/CAG
      let tr
      let ts
      let tt

      for (let j = 0; j < obj.transforms.length; j++) {
        const t = obj.transforms[j]
        if ('rotate' in t) { tr = t }
        if ('scale' in t) { ts = t }
        if ('translate' in t) { tt = t }
      }
      if (ts !== null) {
        const x = ts.scale[0]
        const y = ts.scale[1]
        onCAG = onCAG.scale([x, y])
      }
      if (tr !== null) {
        const z = 0 - tr.rotate
        onCAG = onCAG.rotateZ(z)
      }
      if (tt !== null) {
        const x = cagLengthX(tt.translate[0], svgUnitsPmm, svgUnitsX)
        const y = (0 - cagLengthY(tt.translate[1], svgUnitsPmm, svgUnitsY))
        onCAG = onCAG.translate([x, y])
      }
    }
    lnCAG = lnCAG.union(onCAG)
  }

  // remove this group from the hiearchy
  svgGroups.pop()

  return lnCAG
}

function createSvgParser (src, pxPmm) {
  // create a parser for the XML
  const parser = sax.parser(false, {trim: true, lowercase: false, position: true})
  if (pxPmm !== undefined && pxPmm > parser.pxPmm) {
    parser.pxPmm = pxPmm
  }
  // extend the parser with functions
  parser.onerror = e => console.log('error: line ' + e.line + ', column ' + e.column + ', bad character [' + e.c + ']')

  parser.onopentag = function (node) {
    // console.log('opentag: '+node.name+' at line '+this.line+' position '+this.column);
    const objMap = {
      SVG: svgSvg,
      G: svgGroup,
      RECT: svgRect,
      CIRCLE: svgCircle,
      ELLIPSE: svgEllipse,
      LINE: svgLine,
      POLYLINE: svgPolyline,
      POLYGON: svgPolygon,
      PATH: svgPath,
      USE: svgUse,
      DEFS: () => { svgInDefs = true },
      DESC: () => undefined, // ignored by design
      TITLE: () => undefined, // ignored by design
      STYLE: () => undefined, // ignored by design
      undefined: () => console.log('Warning: Unsupported SVG element: ' + node.name)
    }

    let obj = objMap[node.name](node.attributes)

    // case 'SYMBOL':
    // this is just like an embedded SVG but does NOT render directly, only named
    // this requires another set of control objects
    // only add to named objects for later USE
    //  break;

    if (obj !== null) {
      // add to named objects if necessary
      if ('id' in obj) {
        svgObjects[obj.id] = obj
      }
      if (obj.type === 'svg') {
      // initial SVG (group)
        svgGroups.push(obj)
        svgUnitsPmm = obj.unitsPmm
        svgUnitsX = obj.viewW
        svgUnitsY = obj.viewH
        svgUnitsV = obj.viewP
      } else {
      // add the object to the active group if necessary
        if (svgGroups.length > 0 && svgInDefs === false) {
          var group = svgGroups.pop()
          if ('objects' in group) {
            // console.log('push object ['+obj.type+']');
            // console.log(JSON.stringify(obj));
          // TBD apply presentation attributes from the group
            group.objects.push(obj)
          }
          svgGroups.push(group)
        }
        if (obj.type === 'group') {
          // add GROUPs to the stack
          svgGroups.push(obj)
        }
      }
    }
  }

  parser.onclosetag = function (node) {
    // console.log('closetag: '+node);
    let obj = null
    switch (node) {
      case 'SVG':
        obj = svgGroups.pop()
        // console.log("groups: "+groups.length);
        break
      case 'DEFS':
        svgInDefs = false
        break
      case 'USE':
        obj = svgGroups.pop()
        // console.log("groups: "+groups.length);
        break
      case 'G':
        obj = svgGroups.pop()
        // console.log("groups: "+groups.length);
        break
      default:
        break
    }
    // check for completeness
    if (svgGroups.length === 0) {
      svgObj = obj
    }
  }

  // parser.onattribute = function (attr) {};
  // parser.ontext = function (t) {};

  parser.onend = function () {
  //  console.log('SVG parsing completed')
  }
  // start the parser
  parser.write(src).close()
  return parser
}

// Parse the given SVG source and return a JSCAD script
//
// fn (optional) original filename of SVG source
// options (optional) anonymous object with:
// pxPmm: pixels per milimeter for calcuations
//
function deserialize (src, filename, options) {
  filename = filename || 'svg'
  const defaults = {pxPmm: undefined, version: '0.0.0', addMetaData: true}
  options = Object.assign({}, defaults, options)
  const {version, pxPmm, addMetaData} = options

  // parse the SVG source
  const parser = createSvgParser(src, pxPmm)
  // convert the internal objects to JSCAD code
  const metadata = {
    producer: `OpenJSCAD.org ${version} SVG Importer`,
    date: new Date(),
    source: filename
  }

  let cag
  if (svgObj !== null) {
    cag = codify(svgObj)
  } else {
    console.log('Warning: SVG parsing failed')
  }
  return cag
}

module.exports = deserialize
