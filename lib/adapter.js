const SocketIOAdapter = require('socket.io-adapter');

module.exports = function(client) {

  class Adapter extends SocketIOAdapter {
    constructor(nsp) {
      super(nsp);
      this.client = client;
      this.client.on('client.add', (id, room, nsp) => this.add(id, room, null, nsp));
      this.client.on('client.del', (id, room, nsp) => this.del(id, room, null, nsp));
      this.client.on('client.delAll', (id, nsp) => this.delAll(id, null, nsp));
      this.client.on('client.broadcast', (packet, opts, nsp) => this.broadcast(packet, opts, nsp));
    }
    add(id, room, fn, nsp) {
      if (!nsp) {
        super.add(id, room);
        this.client.add(id, room, fn, this.nsp.name);
        return;
      }
      if (nsp === this.nsp.name) {
        super.add(id, room, fn);
      }
    }
    del(id, room, fn, nsp) {
      if (!nsp) {
        super.del(id, room);
        this.client.del(id, room, fn, this.nsp.name);
        return;
      }
      if (nsp === this.nsp.name) {
        super.del(id, room, fn);
      }
    }
    delAll(id, fn, nsp) {
      if (!nsp) {
        super.delAll(id);
        this.client.delAll(id, fn, this.nsp.name);
      }
      if (nsp === this.nsp.name) {
        super.delAll(id, fn);
      }
    }
    broadcast(packet, opts, nsp) {
      if (!nsp) {
        super.broadcast(packet, opts);
        this.client.broadcast(packet, opts, this.nsp.name);
        return;
      }
      if (nsp === this.nsp.name) {
        super.broadcast(packet, opts);
      }
    }
    clients(rooms, fn) {
      super.clients(rooms, fn);
    }
  };

  return Adapter;
};
