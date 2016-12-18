const Binder = require('socket.io-adapter-multinode').Binder;

class MyBinder extends Binder {
  constructor(adapter, id, sock) {
    super(adapter, id, sock);
  }
}

Binder.defineFunc(MyBinder, 'getWord', function(word) {
  return this.sock.id + word;
});

module.exports = MyBinder;
