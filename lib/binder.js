const EventEmitter = require('events');

class Binder extends EventEmitter {
  constructor(adapter, id, sock) {
    super();
    this.adapter = adapter;
    this.id = id;
    this.sock = sock;
  }
  static defineFunc(cls, key, fn) {
    let localOrRPC = function() {
      if (this.sock) {
        return new Promise((resolve, reject) => {
          resolve(fn.apply(this, arguments));
        });
      }
      return this.adapter.rpc(this.id, key, Array.from(arguments));
    };
    Object.defineProperty(cls.prototype, key, {
      value: localOrRPC,
      writable: true,
      enumerable: false,
      configurable: true
    });
  }
}

module.exports = Binder;
