const SocketIOAdapter = require('socket.io-adapter');
const uuidV4 = require('node-uuid').v4;

module.exports = function(client, binderClass) {

  class Adapter extends SocketIOAdapter {
    constructor(nsp) {
      super(nsp);
      this.client = client;
      this.binderClass = binderClass;
      this.rpcMap = {};
      this.client.on('client.add', (id, room, nsp) => this.add(id, room, null, nsp));
      this.client.on('client.del', (id, room, nsp) => this.del(id, room, null, nsp));
      this.client.on('client.delAll', (id, nsp) => this.delAll(id, null, nsp));
      this.client.on('client.broadcast', (packet, opts, nsp) => this.broadcast(packet, opts, nsp));
      this.client.on('client.rpc_req', (id, key, args, nsp, uuid, port) => this.rpcReq(id, key, args, nsp, uuid, port));
      this.client.on('client.rpc_res', (succ, res, uuid) => this.rpcRes(succ, res, uuid));
    }
    add(id, room, fn, nsp) {
      if (!nsp) {
        console.log('local add', id);
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
        cosnole.log('local del', id);
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
      // TODO: add remote clients
      super.clients(rooms, fn);
    }
    getBinder(id) {
      return new this.binderClass(this, id, this.nsp.connected[id]);
    }
    rpc(id, key, args) {
      let promise, rs, rj, uuid = uuidV4();
      promise = new Promise((resolve, reject) => {
        rs = resolve;
        rj = reject;
      });
      this.rpcMap[uuid] = {
        promise: promise,
        resolve: rs,
        reject: rj
      };
      this.client.rpcReq(id, key, args, this.nsp.name, uuid);
      return promise;
    }
    rpcReq(id, key, args, nsp, uuid, port) {
      if (nsp !== this.nsp.name) {
        this.client.rpcRes(false, 'no such nsp', uuid, port);
        return;
      }
      let binder = this.getBinder(id);
      if (!binder.sock) {
        this.client.rpcRes(false, 'no such id', uuid, port);
        return;
      }
      binder[key].apply(binder, args)
      .then((res) => this.client.rpcRes(true, res, uuid, port))
      .catch((res) => this.client.rpcRes(false, res, uuid, port));
    }
    rpcRes(succ, res, uuid) {
      let ctx = this.rpcMap[uuid];
      if (!ctx) {
        console.log('no such uuid');
        return;
      }
      delete this.rpcMap[uuid];
      if (succ) {
        ctx.resolve(res);
      } else {
        ctx.reject(res);
      }
    }
  };

  return Adapter;
};
