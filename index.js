var o = require('./obj.js')

o.use('store', function(next) {
    console.info('ho')
    next()
})

o.use('store', function(next) {
    console.info('ha')
    next()
})

o.use('store', function(next) {
    console.info('hu')
    next()
})

o.prop('name', 'hal')


var o2 = o.clone()

console.info(o2.hasOwnProperty('name'))
console.info(o2.id)
