// units for converting CSS2 points/length, i.e. CSS2 value / pxPmm
const pxPmm = 1 / 0.2822222         // used for scaling SVG coordinates(PX) to CAG coordinates(MM)
const inchMM = 1 / (1 / 0.039370)     // used for scaling SVG coordinates(IN) to CAG coordinates(MM)
const ptMM = 1 / (1 / 0.039370 / 72)    // used for scaling SVG coordinates(IN) to CAG coordinates(MM)
const pcMM = 1 / (1 / 0.039370 / 72 * 12) // used for scaling SVG coordinates(PC) to CAG coordinates(MM)
const cssPxUnit = 0.2822222 // standard pixel size at arms length on 90dpi screens

module.exports = {
  pxPmm,
  inchMM,
  ptMM,
  pcMM,
  cssPxUnit
}
