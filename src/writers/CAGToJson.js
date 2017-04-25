import { makeBlob } from '../utils/Blob'
const Blob = makeBlob()

export const mimeType = 'application/json'
export function CAGToJson (CAG) {
  var str = '{ "type": "cag","sides": ['
  var comma = ''
  CAG.sides.map(
    function (side) {
      str += comma
      str += JSON.stringify(side)
      comma = ','
    }
  )
  str += '] }'
  return new Blob([str], {
    type: mimeType
  })
}
