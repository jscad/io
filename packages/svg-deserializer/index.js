/*
## License

Copyright (c) 2016 Z3 Development https://github.com/z3dev

All code released under MIT license

Notes:
1) All functions extend other objects in order to maintain namespaces.
*/

const deserialize = require('./index-csg')
const translate = require('./index-jscad')

module.exports = {
  deserialize,
  translate
}
