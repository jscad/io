import { makeBlob } from '../utils/Blob'
const Blob = makeBlob()

export const mimeType = 'application/json'

export function CSGToJson () {
  var str = '{ "type": "csg","polygons": ['
  var comma = ''
  CSG.polygons.map(
    function (polygon) {
      str += comma
      str += JSON.stringify(polygon)
      comma = ','
    }
  )
  str += '],'
  str += '"isCanonicalized": ' + JSON.stringify(this.isCanonicalized) + ','
  str += '"isRetesselated": ' + JSON.stringify(this.isRetesselated)
  str += '}'
  return new Blob([str], {
    type: mimeType
  })
}
