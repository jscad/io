;(function (dxf) { // wrapper for non-node envs
  dxf.reader = function (options) { return new DxfReader(options) }


  // list of states from processing
  // these can be received by calling on(state) below
  dxf.STATES = [
      'start',
      'end',
      'error',
    ]
  // list of events while reading
  dxf.EVENTS = [
      'ongroup',
      'onsection',
      'onheader',
      'onclasses',
      'ontables',
      'onblocks',
      'onentities',
      'onobjects',
    ]

  //
  // Options:
  // - track  : track postion for error reporting
  // - strict : obey strict DXF specifications
  //   - 256 character limit on lines
  function DxfReader (options) {
    var reader = this
    reader.options = options || {}

    reader.trackPosition = reader.options.track != false
    if (reader.trackPosition) {
      reader.line = reader.column = reader.c = 0
    }
  }

  DxfReader.prototype = {
  // set a handler for the given state
    on: function (state, callback) {
    // verify the state
    // set the callback
      var reader = this
      reader['on'+state] = callback
    },

  // set a handler for the given group and value
    absorb: function (group,callback) {
      if (this.absorbers === undefined) {
        this.absorbers = new Map()
      }
      this.absorbers.set(group,callback)
    },

  // read the given data
    write: function (data) {
      var reader = this
      parse(reader,data)
      return reader
    },

    close: function () {
      var reader = this
      var data = null
      reader.isclosed = true
      return reader;
    },
  }

  //
  // emit the start of processing to the onstart handler if any
  //
  function emitstart (reader) {
    return emitstate(reader,'onstart',reader.data)
  }
  
  //
  // emit the group (code and value) to asorbers
  //
  function emitgroup (reader, group, value) {
    //console.log(group+": "+value)
  // emit this group to all listeners
    if (reader.absorbers !== undefined) {
      var absorber = reader.absorbers.get(group)
      if (absorber !== undefined) {
        absorber(reader,group,value)
      }
    }
  }

  //
  // wrap and emit the given error to the onerror handler if any
  //
  function emiterror (reader, er) {
    //closeText(reader)
    if (reader.trackPosition) {
      er += '\nLine: ' + reader.line +
        '\nColumn: ' + reader.column +
        '\nChar: ' + reader.c
    }
    er = new Error(er)
    reader.error = er
    return emitstate(reader,'onerror',er)
  }

  //
  // emit the end of processing to the onend handler if any
  //
  function emitend (reader) {
    return emitstate(reader,'onend',reader.data)
  }
  
  function emitstate (reader,state,data) {
    var onhandler = state.toString()
    reader[onhandler] && reader[onhandler](reader,data)
    return reader
  }

  //
  // parse the given data in the context of the give reader
  //
  function parse (reader, data) {
  // check reader state
    if (reader.error) {
      throw reader.error // throw the last error
    }
    if (reader.isclosed) {
      return error(reader, 'Cannot write after close')
    }

    emitstart(reader)

    if (data === null) {
      return emitend(reader)
    }

  // initial state to initiate parsing
    reader.group = null
    reader.value = null
    reader.error = null
    
    reader.position = 0
    reader.line = 0
    reader.column = 0

  // use or convert the data to String

    var i = 0
    var c = ''
    var l = ''
    while (reader.error === null) {
      c = charAt(data, i++)
      if (!c) {
        break
      }
      if (reader.trackPosition) {
        reader.position++
        if (c === '\n') {
          reader.line++
          reader.column = 0
        } else {
          reader.column++
        }
      }
    // dxf files are parsed line by line
      if (c === '\n') {
        parseLine(reader, l)
        l = ''
      } else {
        l += c
      }
    }
  // emit state change
    emitend(reader)
    return reader
  }

  function parseLine (reader, line) {
    line = line.trim()
    if (reader.group === null) {
      setDxfGroup(reader,line)
      reader.value = null
    } else {
      setDxfValue(reader,line)
    }
  // handle group and value pairs
    if (reader.group !== null && reader.value !== null) {
    // emit events for group and value pairs
      emitgroup(reader,reader.group,reader.value)

      reader.group = null
      reader.value = null
    }
  }

  function setDxfGroup (reader, line) {
  // groups are numeric
    var code = parseInt(line)
    if (isNaN(code)) {
      emiterror(reader,'Invalid group (int)')
      reader.group = null
    } else {
      reader.group = code
    }
  }

  function setDxfValue (reader, line) {
    var g = reader.group // alias
    if (reader.options.strict) {
    // evaluate the value based on DXF specifications
    } else {
      reader.value = line
    }
  }

  //
  // helper function to return expected values
  //
  function charAt (data, i) {
    if (data && data.length > i) {
      return data.charAt(i)
    }
    return ''
  }

})(typeof exports === 'undefined' ? this.dxf = {} : exports)
