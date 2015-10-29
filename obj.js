var id = 0

var obj = {
  // 中间件
  _plugins: {
    fetch: [],
    store: [],
    destroy: []
  },

  _lastStored: {},

  // 属性变化地值
  _changes: [],

  // 属性
  property: {},

  getPluginsOfType: function(type) {
    return this._plugins[type]
  },

  // 注册一个中间件
  use: function(type, fn) {
    if (typeof type === 'object') {
      return this._useAll(type)
    }

    this.getPluginsOfType(type).push(fn)
  },
  _useAll: function(obj) {
    var validTypes = ['store', 'fetch', 'destroy']
    for (var type in obj) {
      if (validTypes.indexOf(type) !== -1) {
        this.use(type, obj[type])
      }
    }
  },
  changes: function() {
    var result = {},
      property = this.property,
      last = this._lastStored

    this._changes.forEach(function(prop) {
      result[prop] = {
        vlaue: property[prop],
        oldValue: last[prop]
      }
    })

    return result
  },
  hasChanges: function() {
    return this._changes.length > 0
  },
  // 获取属性值
  get: function(prop) {
    return this.property[prop]
  },
  has: function(prop) {
    if(this.isProxy) {
        return this.target.has(prop)
    }else {
        return this.property.hasOwnProperty(prop)
    }
  },
  set: function(prop, value) {
    if(prop === 'id')return 
        
    if(!this.has(prop)) {
        this.prop(prop, value)
    } else {
        this[prop] = value
    }
    return this
  },
  // 设置属性值
  setAndSave: function(prop, value) {
    // if (!this.hasOwnProperty(prop)) {
    // return
    // }

    this._pushChanges(prop)

    this.property[prop] = value
    this.store()
  },
  _pushChanges: function(prop) {
    if (this._changes.indexOf(prop) === -1) {
      this._changes.push(prop)
    }
  },
  // 声明属性，并赋予初始值
  prop: function(prop, value) {
    if (prop in this.property) return

    this.property[prop] = value
    this._pushChanges(prop)

    Object.defineProperty(this, prop, {
      get: function() {
        return this.get(prop)
      },
      set: function(value) {
        this._pushChanges(prop)

        this.property[prop] = value
        return this
      },
      enumerable: true
    })
  },
  // 恢复到上次保存的值
  reset: function(prop) {
    var self = this
    last = this._lastStored
    property = this.property

    this._changes.forEach(function(prop) {
      property[prop] = last[prop]
    })

    this._changes = []
  },
  resetProp: function(prop) {
    var index = this._changes.indexOf(prop)
    if (index !== -1) {
      this.property[prop] = this._lastStored[prop]
      this._changes.splice(index, 1)
    }
  },
  // 从存储中恢复属性的值
  fetch: function() {
    invokePlugins('fetch', this, arguments)

    // clear changes
    this._changes = []

    // reset lastStored
    var self = this
    var _last = this._lastStored
    this.propKeys().forEach(function(prop) {
      _last[prop] = self.property[prop]
    })
  },
  // 保存属性到存储中
  store: function() {
    invokePlugins('store', this, arguments)

    // clear changes
    this._changes = []

    // reset lastStored
    var self = this
    var _last = this._lastStored
    this.propKeys().forEach(function(prop) {
      _last[prop] = self.property[prop]
    })
  },
  // 从存储中删除对象
  destroy: function() {
    invokePlugins('destroy', this, arguments)
  },
  propKeys: function() {
    return Object.keys(this.property)
  },
  // 克隆对象
  clone: function() {
    var self = this,
      obj = Object.create(self),
      property = self.property

    // clear public and private property
    obj.property = {}
    obj._changes = []
    obj.lastStored = {}
    obj._plugins = {
      fetch: [],
      store: [],
      destroy: []
    }

    // copy public property
    self.propKeys().forEach(function(prop) {
      obj.prop(prop, property[prop])
    })

    obj.id = ++id
    obj.fetch()

    return obj
  },

  proxy: function() {
    var obj = Object.create(this)
    obj._plugins = {
      fetch: [],
      store: [],
      destroy: []
    }
    obj.isProxy = true
    obj.target = this
    return obj
  }
}

obj.prop('id', id)

function collectPlugins(type, obj) {
  var protos = [],
    proto = obj,
    rootProto = Object.prototype,
    plugins = []

  do {
    if (proto.hasOwnProperty('_plugins')) {
      protos.push(proto)
    }
    proto = Object.getPrototypeOf(proto)
  } while (proto !== rootProto)

  protos = protos.reverse()

  for (var i = 0, l = protos.length; i < l; i++) {
    proto = protos[i]
    plugins.push.apply(plugins, proto.getPluginsOfType(type))
  }

  return plugins
}

function invokePlugins(type, ctx, args) {

  var plugins = ctx.getPluginsOfType(type)
  if (Object.getPrototypeOf(ctx) !== Object.prototype) {
    plugins = collectPlugins(type, ctx)
    if (type === 'store') {
      plugins = plugins.reverse()
    }
  }

  if (plugins.length === 0) {
    return
  }

  var i = 0

  next = function() {
    i = i + 1
    var fn = plugins[i]
    if (fn) {
      if (arguments.length) {
        fn.apply(ctx, Array.prototype.slice.call(arguments).concat(next))
      } else {
        fn.call(ctx, next)
      }
    }
  }

  if (args.length) {
    plugins[0].apply(ctx, Array.prototype.slice.call(args).concat(next))
  } else {
    plugins[0].call(ctx, next)
  }
}

module.exports = obj