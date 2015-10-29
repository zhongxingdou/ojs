/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var o = __webpack_require__(1)

	// o.use('store', function(next) {
	//     console.info('ho')
	//     next()
	// })

	// o.use('store', function(next) {
	//     console.info('ha')
	//     next()
	// })

	// o.use('store', function(next) {
	//     console.info('hu')
	//     next()
	// })

	// o.prop('name', 'hal')


	var localStorePlugin = {
	  store: function(obj) {
	    localStorage.setItem(obj.id, JSON.stringify(obj))
	  },
	  fetch: function(id) {
	    var json = localStorage.getItem(id)
	    return JSON.parse(json)
	  },
	  destroy: function(id) {
	    localStorage.removeItem(id)
	  }
	}

	o.use(localStorePlugin)


	var htmlPlugin = {
	  fetch: function() {
	    var $this = this
	        form = $this.form

	    this.keys().forEach(function(prop){
	      if(form[prop]) {
	        form[prop].value = $this.get(prop)
	      }
	    })
	  },
	  store: function() {
	    var $this = this
	        form = $this.form

	    $this.keys().forEach(function(prop){
	      if(form[prop]) {
	        $this.set(prop, form[prop].value)
	      }
	    })
	  }
	}

	var o2 = o.clone()

	o2.prop('name', 'hal')
	o2.prop('age', 30)

	// o2 view
	var o2FormView = o2.proxy()
	o2FormView.use(htmlPlugin)
	o2FormView.form = document.getElementById('o2Form')

	o2FormView.fetch()

	o2FormView.form.onsubmit = function(event) {
	  event.preventDefault()
	  o2FormView.store()
	}

	console.info(o2.hasOwnProperty('name'))
	console.info(o2.id)


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var id = 0

	var obj = {
	    // 中间件
	    _pipes: {
	        fetch: [],
	        store: [],
	        destroy: []
	    },

	    // 属性的前一次的值
	    _last: {},

	    // 属性
	    property: {},

	    // 注册一个中间件
	    use: function (type, fn) {
	        if(typeof type === 'object') {
	            return this._useAll(type)
	        }

	        this._pipes[type].push(fn)
	    },
	    _useAll: function(obj) {
	        var validTypes = ['store', 'fetch', 'destroy']
	        for(var type in obj) {
	            if(validTypes.indexOf(type) !== -1) {
	                this.use(type, obj[type])
	            }
	        }
	    },
	    // 获取属性值
	    get: function (prop) {
	        return this.property[prop]
	    },
	    // 设置属性值
	    set: function (prop, value) {
	        if (!this.hasOwnProperty(prop)) {
	            return
	        }

	        this._last[prop] = this[prop]
	        this.property[prop] = value
	        this.store()
	    },
	    // 声明属性，并赋予初始值
	    prop: function (prop, value) {
	        this.property[prop] = value

	        Object.defineProperty(this, prop, {
	            get: function () {
	                return this.get(prop)
	            },
	            set: function (value) {
	                return this.set(prop, value)
	            },
	            enumerable: true
	        })
	    },
	    // 恢复到上次保存的值
	    reset: function (prop) {
	        this.property[prop] = this._last[prop]
	    },
	    // 从存储中恢复属性的值
	    fetch: function () {
	        walkPipe('fetch', this)
	    },
	    // 保存属性到存储中
	    store: function () {
	        walkPipe('store', this)
	    },
	    // 从存储中删除对象
	    destroy: function () {
	        walkPipe('destroy', this)
	    },
	    keys: function() {
	        return Object.keys(this.property)
	    },
	    // 克隆对象
	    clone: function () {
	        var obj = Object.create(this)

	        obj.property = {}
	        Object.keys(this.property).forEach(function(prop) {
	            obj.prop(prop, undefined)
	        })

	        obj.id = ++id

	        obj._last = {}

	        obj.store()
	        return obj
	    },

	    proxy: function () {
	        var obj  = Object.create(this)
	        obj._pipes = {
	            fetch: [],
	            store: [],
	            destroy: []
	        }
	        return obj
	    }
	}

	obj.prop('id', id)

	function collectWorkers(type, obj) {
	    var protos = [],
	        proto = obj,
	        rootProto = Object.prototype,
	        workers = []

	    do{
	        protos.push(proto)
	        proto = Object.getPrototypeOf(proto)
	    } while(proto !== rootProto)

	    for(var i = 0, l = protos.length; i<l; i++) {
	        proto = protos[i]
	        workers.push.apply(workers, proto._pipes[type])
	    }

	    return workers
	}

	function walkPipe(type, ctx) {
	    var workers = ctx._pipes[type]
	    if(Object.getPrototypeOf(ctx) !== Object.prototype) {
	        workers = collectWorkers(type, ctx)
	    }

	    if (workers.length === 0) {
	        return
	    }

	    var i = 0

	    next = (function() {
	        i = i + 1
	        var fn = workers[i]
	        if (fn) {
	            fn.call(this, next)
	        }
	    }).bind(ctx)

	    workers[i].call(ctx, next)
	}

	module.exports = obj

/***/ }
/******/ ]);