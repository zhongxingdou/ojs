var id = 0

var obj = {
    // 中间件
    _pipes: {
        fetch: [],
        store: [],
        delete: []
    },

    // 属性的前一次的值
    _last: {},

    // 属性
    property: {},

    // 注册一个中间件
    use: function (type, fn) {
        this._pipes[type].push(fn)
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
        walkPipe(this._pipes.fetch, this)
    },
    // 保存属性到存储中
    store: function () {
        walkPipe(this._pipes.store, this)
    },
    // 从存储中删除对象
    delete: function () {
        walkPipe(this._pipes.delete, this)
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
    }
}

obj.prop('id', id)

function walkPipe(workers, ctx) {
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