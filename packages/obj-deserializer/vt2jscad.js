// vertices, triangles, normals and colors
function vt2jscad (v, t, n, c) {
  let src = ''
  src += 'polyhedron({ points: [\n  '
  for (let i = 0, j = 0; i < v.length; i++) {
    if (j++) src += ',\n  '
    src += '[' + v[i] + ']' // .join(", ");
  }
  src += '],\n  polygons: [\n  '
  for (let i = 0, j = 0; i < t.length; i++) {
    if (j++) src += ',\n  '
    src += '[' + t[i] + ']' // .join(', ');
  }
  if (c && t.length === c.length) {
    src += '],\n\tcolors: [\n  '
    for (let i = 0, j = 0; i < c.length; i++) {
      if (j++) src += ',\n  '
      src += '[' + c[i] + ']' // .join(', ');
    }
  }
  src += '] })\n'
  return src
}

module.exports = {
  vt2jscad
}
