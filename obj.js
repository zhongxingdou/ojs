var id = 0

var obj = {
    id: id,
    _pipes: {
        fetch: [],
        store: [],
        delete: []
    },
    _last: {},
    use: function(type, fn) {
        this._pipes[type].push(fn)
    },
    get: function(prop) {
        return this[prop]
    },
    set: function(prop, value) {
        if(this.hasOwnProperty(prop)) {
            this._last[prop] = this[prop]
        }

        this[prop] = value
        this.store()
    },
    reset: function(prop) {
        this[prop] = this._last[prop]
    },
    fetch: function() {
        walkPipes(this._pipes.fetch, this)
    },
    store: function() {
        walkPipes(this._pipes.store, this)
    },
    delete: function() {
        walkPipes(this._pipes.delete, this)
    },
    clone: function() {
        var obj = Object.create(this)
        obj.id = ++id
        obj._last = {}
        obj.store()
        return obj
    }
}

function walkPipes(pipes, ctx) {
    if(pipes.length === 0) return

    var i = 0

    next = (function() {
        i = i + 1
        var fn = pipes[i]
        if (fn) {
            fn.call(this, next)
        }
    }).bind(ctx)

    pipes[i].call(ctx, next)
}

module.exports = obj