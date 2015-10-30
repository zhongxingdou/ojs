var o = require('./obj.js')

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
  store: function(next) {
    console.info('store in localStorage')
    localStorage.setItem(this.id, JSON.stringify(this.property))
    next()
  },
  fetch: function(next) {
    console.info('fetch from localStorage')
    var json = localStorage.getItem(this.id)
    var props = JSON.parse(json)
    for (var prop in props) {
      this.set(prop, props[prop])
    }
    next()
  },
  destroy: function(next) {
    localStorage.removeItem(this.id)
    next()
  }
}

o.use(localStorePlugin)


var htmlPlugin = {
  fetch: function(next) {
    var $this = this
    form = $this.form

    this.propKeys().forEach(function(prop) {
      if (form[prop]) {
        form[prop].value = $this.get(prop)
      }
    })

    next()
  },
  store: function(next) {
    var $this = this
    form = $this.form

    $this.propKeys().forEach(function(prop) {
      if (form[prop] instanceof Element) {
        $this[prop] = form[prop].value
      }
    })
    next()
  }
}

var o2 = o.clone()
o2.fetch()

if(!o2.has('name')){
  o2.prop('name', 'hal')
  o2.prop('age' , 30)
  o2.store()
}

// o2 view
var o2FormView = o2.proxy()
o2FormView.use(htmlPlugin)
o2FormView.form = document.getElementById('o2Form')

o2FormView.fetch()

o2FormView.form.onsubmit = function(event) {
  event.preventDefault()
  o2FormView.store()
}