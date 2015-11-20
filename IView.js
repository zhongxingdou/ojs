var IView = {
  registView: function(view) {},

  // dispatch message to listners
  dispatch: function(type, args) {},

  // submit message to listenTos
  submit: function(Type, args){},

  // receive message from sub and parent
  receive: function(type, args) {}
}