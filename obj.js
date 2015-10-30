var id = 0

var obj = {
  // 中间件
  _plugins: {
    // 用于获取数据
    fetch: [],
    // 用于存储数据
    store: [],
    // 用于删除数据
    destroy: []
  },

  // 属性
  property: {},

  // 属性最后一次保存的值
  _lastStored: {},

  // 值有变化的属性名列表
  _changes: [],

  // 声明属性，并赋予初始值
  prop: function(prop, value, readonly) {
    if (prop in this.property) { // 已经存在
      this[prop] = value
    } else { // 未声明
      var option = {
        enumerable: true
      }

      if(readonly) {
        option.value = value
        option.writable  = false
      } else {
        option.get = function() {
          return this.get(prop)
        }

        option.set = function(value) {
          this._pushChanges(prop)
          this.property[prop] = value
          return this
        }
      }

      Object.defineProperty(this, prop, option)

      if(!readonly) this[prop] = value
    }

    return this
  },

  // 获取所有属性名
  propKeys: function() {
    return Object.keys(this.property)
  },

  // 是否拥有属性
  has: function(prop) {
    if (this.isProxy) {
      return this.target.has(prop)
    } else {
      return this.property.hasOwnProperty(prop)
    }
  },

  // 获取属性值
  get: function(prop) {
    return this.property[prop]
  },

  // 设置属性值，如果没有该属性，会声明并赋值
  set: function(prop, value) {
    if(prop === 'id')return this

    if (!this.has(prop)) {
      this.prop(prop, value)
    } else {
      this[prop] = value
    }
    return this
  },

  // 设置属性值并保存
  setAndSave: function(prop, value) {
    this.set(prop, vlaue)
    this.store()
  },

  // 属性值是否改变
  hasChanges: function() {
    return this._changes.length > 0
  },

  // 将改变的属性名放入列表中
  _pushChanges: function(prop) {
    if (this._changes.indexOf(prop) === -1) {
      this._changes.push(prop)
    }
  },

  // 获取一个对象，包含已改变的属性的新旧值
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

  // 恢复属性到上次保存的值
  reset: function(prop) {
    var self = this
    last = this._lastStored
    property = this.property

    this._changes.forEach(function(prop) {
      property[prop] = last[prop]
    })

    this._changes = []
  },

  // 恢复指定名称的属性到上次保存的值
  resetProp: function(prop) {
    var index = this._changes.indexOf(prop)
    if (index !== -1) {
      this.property[prop] = this._lastStored[prop]
      this._changes.splice(index, 1)
    }
  },

  // 注册指定类型的中间件
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

  // 获取指定类型的中间件
  getPluginsOfType: function(type) {
    return this._plugins[type]
  },

  // 执行 fetch 中间件
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

  // 执行 store 中间件
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

  // 执行 destroy 中间件
  destroy: function() {
    invokePlugins('destroy', this, arguments)
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

    obj.prop('id', ++id, true) // readonly

    return obj
  },

  // 生成对象的代理，该代理拥有独立的插件表
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

obj.prop('id', id, true) // readonly

// 从原型链的对象上收集指定类型的插件
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

// 执行指定类型的插件
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