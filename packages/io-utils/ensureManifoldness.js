/**
 * wrapper around internal csg methods (in case they change) to make sure
 * it resuts in a manifold mesh
 * @constructor
 * @param {string} title - The title of the book.
 * @return {csg}
 */
function ensureManifoldness (csg) {
  csg = csg.reTesselated ? csg.reTesselated() : csg
  csg = csg.canonicalized ? csg.canonicalized() : csg
  return csg
}

module.exports = ensureManifoldness
