const mimeType = 'application/json'
function write (CAG) {
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
  return [str]
}

module.exports = {
  write,
  mimeType
}
