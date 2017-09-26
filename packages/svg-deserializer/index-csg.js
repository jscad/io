/*
## License

Copyright (c) 2016 Z3 Development https://github.com/z3dev
2017 Mark 'kaosat-dev' Moissette

Refactor and upgrades sponsored by ***

All code released under MIT license
*/

const sax = require('sax')
const {CSG, CAG} = require('@jscad/csg')

const {cagColor, cssStyle, css2cag, svg2cagX, svg2cagY, cagLengthX, cagLengthY, cagLengthP} = require('./helpers')
const {pxPmm, cssPxUnit} = require('./constants')

let svgUnitsX
let svgUnitsY
let svgUnitsV

const svgCore = function (obj, element) {
  if ('ID' in element) { obj.id = element.ID }
}

const svgPresentation = function (obj, element) {
  // presentation attributes for all
  if ('DISPLAY' in element) { obj.visible = element.DISPLAY }
  // presentation attributes for solids
  if ('COLOR' in element) { obj.fill = cagColor(element.COLOR) }
  if ('OPACITY' in element) { obj.opacity = element.OPACITY }
  if ('FILL' in element) {
    obj.fill = cagColor(element.FILL)
  } else {
    var s = cssStyle(element, 'fill')
    if (s !== null) {
      obj.fill = cagColor(s)
    }
  }
  if ('FILL-OPACITY' in element) { obj.opacity = element['FILL-OPACITY'] }
  // presentation attributes for lines
  if ('STROKE-WIDTH' in element) {
    obj.strokeWidth = element['STROKE-WIDTH']
  } else {
    var sw = cssStyle(element, 'stroke-width')
    if (sw !== null) {
      obj.strokeWidth = sw
    }
  }
  if ('STROKE' in element) {
    obj.stroke = cagColor(element.STROKE)
  } else {
    let s = cssStyle(element, 'stroke')
    if (s !== null) {
      obj.stroke = cagColor(s)
    }
  }
  if ('STROKE-OPACITY' in element) { obj.strokeOpacity = element['STROKE-OPACITY'] }
}

const svgTransforms = function (cag, element) {
  var list = null
  if ('TRANSFORM' in element) {
    list = element.TRANSFORM
  } else {
    var s = cssStyle(element, 'transform')
    if (s !== null) { list = s }
  }
  if (list !== null) {
    cag.transforms = []
    let exp = new RegExp('\\w+\\(.+\\)', 'i')
    var v = exp.exec(list)
    while (v !== null) {
      let s = exp.lastIndex
      var e = list.indexOf(')') + 1
      var t = list.slice(s, e) // the transform
      t = t.trim()
      // add the transform to the CAG
      // which are applied in the order provided
      var n = t.slice(0, t.indexOf('('))
      var a = t.slice(t.indexOf('(') + 1, t.indexOf(')')).trim()
      if (a.indexOf(',') > 0) { a = a.split(',') } else { a = a.split(' ') }
      let o
      switch (n) {
        case 'translate':
          o = {translate: [a[0], a[1]]}
          cag.transforms.push(o)
          break
        case 'scale':
          if (a.length === 1) a.push(a[0]) // as per SVG
          o = {scale: [a[0], a[1]]}
          cag.transforms.push(o)
          break
        case 'rotate':
          o = {rotate: a}
          cag.transforms.push(o)
          break
        // case 'matrix':
        // case 'skewX':
        // case 'skewY':
        default:
          break
      }
    // shorten the list and continue
      list = list.slice(e, list.length)
      v = exp.exec(list)
    }
  }
}

const svgSvg = function (element) {
  // default SVG with no viewport
  var obj = {type: 'svg', x: 0, y: 0, width: '100%', height: '100%', strokeWidth: '1'}

  // default units per mm
  obj.unitsPmm = [pxPmm, pxPmm]

  if ('PXPMM' in element) {
    // WOW! a supplied value for pixels per milimeter!!!
    obj.pxPmm = element.PXPMM
    obj.unitsPmm = [obj.pxPmm, obj.pxPmm]
  }
  if ('WIDTH' in element) { obj.width = element.WIDTH }
  if ('HEIGHT' in element) { obj.height = element.HEIGHT }
  if ('VIEWBOX' in element) {
    var list = element.VIEWBOX.trim()
    var exp = new RegExp('([\\d\\.\\-]+)[\\s,]+([\\d\\.\\-]+)[\\s,]+([\\d\\.\\-]+)[\\s,]+([\\d\\.\\-]+)', 'i')
    var v = exp.exec(list)
    if (v !== null) {
      obj.viewX = parseFloat(v[1])
      obj.viewY = parseFloat(v[2])
      obj.viewW = parseFloat(v[3])
      obj.viewH = parseFloat(v[4])
    }
  // apply the viewbox
    if (obj.width.indexOf('%') < 0) {
    // calculate a scaling from width and viewW
      var s = css2cag(obj.width, this.pxPmm) // width in millimeters
      s = obj.viewW / s
    // scale the default units
      // obj.unitsPmm[0] = obj.unitsPmm[0] * s;
      obj.unitsPmm[0] = s
    } else {
    // scale the default units by the width (%)
      const u = obj.unitsPmm[0] * (parseFloat(obj.width) / 100.0)
      obj.unitsPmm[0] = u
    }
    if (obj.height.indexOf('%') < 0) {
    // calculate a scaling from height and viewH
      let s = css2cag(obj.height, pxPmm) // height in millimeters
      s = obj.viewH / s
    // scale the default units
      // obj.unitsPmm[1] = obj.unitsPmm[1] * s;
      obj.unitsPmm[1] = s
    } else {
    // scale the default units by the width (%)
      const u = obj.unitsPmm[1] * (parseFloat(obj.height) / 100.0)
      obj.unitsPmm[1] = u
    }
  } else {
    obj.viewX = 0
    obj.viewY = 0
    obj.viewW = 1920 / obj.unitsPmm[0] // average screen size / pixels per unit
    obj.viewH = 1080 / obj.unitsPmm[1] // average screen size / pixels per unit
  }
  obj.viewP = Math.sqrt((obj.viewW * obj.viewW) + (obj.viewH * obj.viewH)) / Math.SQRT2

  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)

  obj.objects = []
  // console.log(JSON.stringify(obj));
  return obj
}

const svgEllipse = function (element) {
  const obj = {type: 'ellipse', cx: '0', cy: '0', rx: '0', ry: '0'}
  if ('CX' in element) { obj.cx = element.CX }
  if ('CY' in element) { obj.cy = element.CY }
  if ('RX' in element) { obj.rx = element.RX }
  if ('RY' in element) { obj.ry = element.RY }
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)
  return obj
}

const svgLine = function (element) {
  var obj = {type: 'line', x1: '0', y1: '0', x2: '0', y2: '0'}
  if ('X1' in element) { obj.x1 = element.X1 }
  if ('Y1' in element) { obj.y1 = element.Y1 }
  if ('X2' in element) { obj.x2 = element.X2 }
  if ('Y2' in element) { obj.y2 = element.Y2 }
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)
  return obj
}

const svgListOfPoints = function (list) {
  var points = []
  var exp = new RegExp('([\\d\\-\\+\\.]+)[\\s,]+([\\d\\-\\+\\.]+)[\\s,]*', 'i')
  list = list.trim()
  var v = exp.exec(list)
  while (v !== null) {
    var point = v[0]
    var next = exp.lastIndex + point.length
    point = {x: v[1], y: v[2]}
    points.push(point)
    list = list.slice(next, list.length)
    v = exp.exec(list)
  }
  return points
}

const svgPolyline = function (element) {
  const obj = {type: 'polyline'}
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)

  if ('POINTS' in element) {
    obj.points = svgListOfPoints(element.POINTS)
  }
  return obj
}

const svgPolygon = function (element) {
  const obj = {type: 'polygon'}
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)

  if ('POINTS' in element) {
    obj.points = svgListOfPoints(element.POINTS)
  }
  return obj
}

const svgRect = function (element) {
  var obj = {type: 'rect', x: '0', y: '0', rx: '0', ry: '0', width: '0', height: '0'}

  if ('X' in element) { obj.x = element.X }
  if ('Y' in element) { obj.y = element.Y }
  if ('RX' in element) {
    obj.rx = element.RX
    if (!('RY' in element)) { obj.ry = obj.rx } // by SVG specification
  }
  if ('RY' in element) {
    obj.ry = element.RY
    if (!('RX' in element)) { obj.rx = obj.ry } // by SVG specification
  }
  if (obj.rx !== obj.ry) {
    console.log('Warning: Unsupported RECT with RX and RY radius')
  }
  if ('WIDTH' in element) { obj.width = element.WIDTH }
  if ('HEIGHT' in element) { obj.height = element.HEIGHT }
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)
  return obj
}

const svgCircle = function (element) {
  var obj = {type: 'circle', x: '0', y: '0', radius: '0'}

  if ('CX' in element) { obj.x = element.CX }
  if ('CY' in element) { obj.y = element.CY }
  if ('R' in element) { obj.radius = element.R }
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  svgPresentation(obj, element)
  return obj
}

const svgGroup = function (element) {
  var obj = {type: 'group'}
// transforms
  svgTransforms(obj, element)
// core attributes
  svgCore(obj, element)
// presentation attributes
  svgPresentation(obj, element)

  obj.objects = []
  return obj
}

//
// Convert the PATH element into object representation
//
const svgPath = function (element) {
  var obj = {type: 'path'}
  // transforms
  svgTransforms(obj, element)
  // core attributes
  svgCore(obj, element)
  // presentation attributes
  // svgPresentation(obj,element);

  obj.commands = []
  if ('D' in element) {
    var co = null // current command
    var bf = ''

    var i = 0
    var l = element.D.length
    while (i < l) {
      var c = element.D[i]
      switch (c) {
      // numbers
      // FIXME support E notation numbers
        case '-':
          if (bf.length > 0) {
            co.p.push(bf)
            bf = ''
          }
          bf += c
          break
        case '.':
          if (bf.length > 0) {
            if (bf.indexOf('.') >= 0) {
              co.p.push(bf)
              bf = ''
            }
          }
          bf += c
          break
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          bf += c
          break
        // commands
        case 'a':
        case 'A':
        case 'c':
        case 'C':
        case 'h':
        case 'H':
        case 'l':
        case 'L':
        case 'v':
        case 'V':
        case 'm':
        case 'M':
        case 'q':
        case 'Q':
        case 's':
        case 'S':
        case 't':
        case 'T':
        case 'z':
        case 'Z':
          if (co !== null) {
            if (bf.length > 0) {
              co.p.push(bf)
              bf = ''
            }
            obj.commands.push(co)
          }
          co = {c: c, p: []}
          break
        // white space
        case ',':
        case ' ':
        case '\n':
          if (co !== null) {
            if (bf.length > 0) {
              co.p.push(bf)
              bf = ''
            }
          }
          break
        default:
          break
      }
      i++
    }
    if (i === l && co !== null) {
      if (bf.length > 0) {
        co.p.push(bf)
      }
      obj.commands.push(co)
    }
  }
  return obj
}

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

sax.SAXParser.prototype.svgObjects = []    // named objects
sax.SAXParser.prototype.svgGroups = []    // groups of objects
sax.SAXParser.prototype.svgInDefs = false // svg DEFS element in process
sax.SAXParser.prototype.svgUnitsPmm = [1, 1]

const reflect = function (x, y, px, py) {
  var ox = x - px
  var oy = y - py
  if (x === px && y === px) return [x, y]
  if (x === px) return [x, py + (-oy)]
  if (y === py) return [px + (-ox), y]
  return [px + (-ox), py + (-oy)]
}

// Return the value for the given attribute from the group hiearchy
const groupValue = function (name) {
  var i = svgGroups.length
  while (i > 0) {
    var g = svgGroups[i - 1]
    if (name in g) {
      return g[name]
    }
    i--
  }
  return null
}
const codify = function (group) {
  const level = svgGroups.length
  // add this group to the heiarchy
  svgGroups.push(group)
  // create an indent for the generated code
  var indent = '  '
  var i = level
  while (i > 0) {
    indent += '  '
    i--
  }
  // pre-code
  let lnCAG = new CAG()

  // rootObject
  let objects = []

// generate code for all objects
  for (i = 0; i < group.objects.length; i++) {
    console.log('bla', group.objects)
    var obj = group.objects[i]
    const onCAG = require('./shapesMapCsg')(codify, svgUnitsPmm, svgUnitsX, svgUnitsY, svgUnitsV)

    if ('fill' in obj) {
    // FIXME when CAG supports color
    //  code += indent+on+' = '+on+'.setColor(['+obj.fill[0]+','+obj.fill[1]+','+obj.fill[2]+']);\n';
    }
    if ('transforms' in obj) {
    // NOTE: SVG specifications require that transforms are applied in the order given.
    // But these are applied in the order as required by CSG/CAG
      var tr = null
      var ts = null
      var tt = null

      var j = 0
      for (j = 0; j < obj.transforms.length; j++) {
        var t = obj.transforms[j]
        if ('rotate' in t) { tr = t }
        if ('scale' in t) { ts = t }
        if ('translate' in t) { tt = t }
      }
      if (ts !== null) {
        const x = ts.scale[0]
        const y = ts.scale[1]
        //FIXME : rootCAG or pathCag ?
        rootCAG = rootCAG.scale([x, y])
      }
      if (tr !== null) {
        const z = 0 - tr.rotate
        rootCAG = rootCAG.rotateZ(z)
      }
      if (tt !== null) {
        const x = cagLengthX(tt.translate[0], svgUnitsPmm, svgUnitsX)
        const y = (0 - cagLengthY(tt.translate[1], svgUnitsPmm, svgUnitsY))
        rootCAG = rootCAG.translate([x, y])
        // code += indent + on + ' = ' + on + '.translate([' + x + ',' + y + ']);\n'
      }
    }

    ln = ln.union(rootCAG)
  }

  // remove this group from the hiearchy
  svgGroups.pop()

  // temporary hack
  let tmp = new CAG()
  objects.forEach(x => tmp = tmp.union(x))
  return tmp
}

function createSvgParser (src, pxPmm) {
// create a parser for the XML
  var parser = sax.parser(false, {trim: true, lowercase: false, position: true})
  if (pxPmm !== undefined) {
    if (pxPmm > parser.pxPmm) parser.pxPmm = pxPmm
  }
// extend the parser with functions
  parser.onerror = function (e) {
    console.log('error: line ' + e.line + ', column ' + e.column + ', bad character [' + e.c + ']')
  }

  // parser.ontext = function (t) {
  // };

  parser.onopentag = function (node) {
    // console.log('opentag: '+node.name+' at line '+this.line+' position '+this.column);
    // for (x in node.attributes) {
    //  console.log('    '+x+'='+node.attributes[x]);
    // }
    var obj = null
    switch (node.name) {
      case 'SVG':
        obj = svgSvg(node.attributes)
        break
      case 'G':
        obj = svgGroup(node.attributes)
        break
      case 'RECT':
        obj = svgRect(node.attributes)
        break
      case 'CIRCLE':
        obj = svgCircle(node.attributes)
        break
      case 'ELLIPSE':
        obj = svgEllipse(node.attributes)
        break
      case 'LINE':
        obj = svgLine(node.attributes)
        break
      case 'POLYLINE':
        obj = svgPolyline(node.attributes)
        break
      case 'POLYGON':
        obj = svgPolygon(node.attributes)
        break
      // case 'SYMBOL':
      // this is just like an embedded SVG but does NOT render directly, only named
      // this requires another set of control objects
      // only add to named objects for later USE
      //  break;
      case 'PATH':
        obj = svgPath(node.attributes)
        break
      case 'USE':
        obj = svgUse(node.attributes)
        break
      case 'DEFS':
        svgInDefs = true
        break
      case 'DESC':
      case 'TITLE':
      case 'STYLE':
      // ignored by design
        break
      default:
        console.log('Warning: Unsupported SVG element: ' + node.name)
        break
    }

    if (obj !== null) {
    // add to named objects if necessary
      if ('id' in obj) {
        svgObjects[obj.id] = obj
        // console.log('saved object ['+obj.id+','+obj.type+']');
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
    var obj = null
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

  // parser.onattribute = function (attr) {
  // };

  parser.onend = function () {
  //  console.log('SVG parsing completed')
  }
  // start the parser
  parser.write(src).close()

  return parser
}

//
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
  let code = addMetaData ? `//
  // producer: OpenJSCAD.org ${version} SVG Importer
  // date: ${new Date()}
  // source: ${filename}
  //
  ` : ''
  let cag
  if (svgObj !== null) {
    cag = codify(svgObj)
  } else {
    console.log('Warning: SVG parsing failed')
  }
  return cag
}

module.exports = deserialize
