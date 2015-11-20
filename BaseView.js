var BaseView = Object.create({
  init: function() {
    this.constuctor.prototype.init.call(this)
    this.__property = {}
  },

  __dispatchSet: function(prop, value) {
    this[prop] = value
    this.dispatch(':propChange', [prop, value])
  },

  // invoke on received :propUnset
  __dispatchUnset: function(prop) {
    delete this[prop]
    this.dispatch(':propUnset', prop)
  },

  // invoke on received :setProp 
  __submitSet: function(prop, value, callback) {
    this.submit(':setProp', [prop, value], function(){
      if(prop in this.__property) {
        this[prop] = value
      } else {
        this.prop(prop, value)
      }

      callback(true)
    })
  },

  submit: function(type, args, callback){
    callback()
  },

  // invoke on received :unsetProp 
  __submitUnset: function(prop, callback) {
    this.submit(':unsetProp', [prop], function() {
      delete this[prop]
      callback(true)
    })
  },

  // invoke on receive :getProp
  __getProp: function(prop, callback) {
    callback(this[prop])
  },

  prop: function(prop, value, option) {
    var property = this.__property
    
    if (prop in property) { // 已经存在
      this[prop] = value
    } else { // 未声明
      var defaultOption = {
        enumerable: true,
        get: function() {
          return property[prop]
        },
        set: function(val) {
          property[prop] = val
        }
      }

      option = option || {}
      for(var key in defaultOption) {
        if(!(key in option)) {
          option[key] = defaultOption[key]
        }
      }

      var isConst = option.writable === false
      if(isConst){
        option.value = value
        delete option.get
        delete option.set
      }


      Object.defineProperty(this, prop, option)
      if(!isConst) this[prop] = value
    }

    return this
  },

  keys: function() {
    return Object.keys(this.__property)
  }
}, AbstractView)

