var AbstractView = {
  init: function() {
    this.__views = []
  },

  registView: function(view) {
    var self = this

    self.__views.push(view)

    view.submit = self.receive.bind(self)
  },

  // send message to sub views
  dispatch: function(type, args) {
    this.__views.forEach(function(view) {
      view.receive.apply(view, args)
    })
  },

  // send message to parent view
  submit: null,

  // receive message from sub and parent
  receive: function(type, args) {
    var msgMethodMap = {
      // from parent
      ':propChange': '__dispatchSet',
      ':propUnset': '__dispatchUnset',

      // from sub
      ':setProp': '__submitSet',
      ':unsetProp': '__submitUnset',
      ':getProp': '__getProp',
      ':unRegist': '__unRegistView'
    } 


    var method = msgMethodMap[type]
    if(method && this[method]) {
      this[method].apply(this, args)
    }
  },

  // invoke on received :propChange
  __dispatchSet: function(prop, value) {},

  // invoke on received :propUnset
  __dispatchUnset: function(prop) {},

  // invoke on received :setProp 
  __submitSet: function(prop, value, callback) {},

  // invoke on received :unsetProp 
  __submitUnset: function(prop, callback) {},

  // invoke on receive :getProp
  __getProp: function(prop, callback) {},

  // invoke on receive :unRegist
  __unRegistView: function(view) {
    var idx = self.__views.indexOf(view)
    if(idx !== -1) {
      self.__views.splice(idx, 1)
    }
  }
}