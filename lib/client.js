const net = require('net');
const Socket = require('./socket');
const EventEmitter = require('events');
const debug = require('debug')('multinode:client');

class Client extends EventEmitter {
  constructor(serverPort, clientPort) {
    super();
    this.clientSockets = {};
    this.localRooms = {};
    this.remoteRooms = {};
    this.clientPort = clientPort;
    this.clientServer = net.createServer((cs) => {
      let sock = new Socket(cs);
      sock.emit('send', {
        action: 'client.rooms',
        rooms: this.localRooms
      });
      this.onClientSocketConnect(sock);
    });
    this.clientServer.listen(clientPort, () => {
      debug('client listening');
    });
    let ss = net.connect({ port: serverPort }, () => {
      this.serverSock = new Socket(ss);
      this.serverSock.emit('send', {
        action: 'server.reg', port: clientPort
      });
      this.onServerSocketConnect(this.serverSock);
    });
  }
  connectClient(port) {
    let cs = net.connect({ port: port }, () => {
      let sock = this.clientSockets[port] = new Socket(cs);
      sock.emit('send', {
        action: 'client.reg', port: this.clientPort
      });
      this.onClientSocketConnect(sock, port);
    });
  }
  onServerSocketConnect(sock) {
    sock.on('recv', (data) => {
      debug('client server recv', data);
      switch (data.action) {
        case 'server.reg': {
          data.ports.forEach((port) => this.connectClient(port));
        } break;
      }
    });
    sock.on('close', () => {
      // TODO: event, not throw
      throw 'server close';
    });
  }
  onClientSocketConnect(sock, port) {
    sock.on('recv', (data) => {
      debug('client client recv', data);
      switch (data.action) {
        case 'client.reg': {
          this.clientSockets[data.port] = sock;
          port = data.port;
        } break;
        case 'client.rooms': {
          Object.keys(data.rooms).forEach((nsp) => {
            let dn = data.rooms[nsp];
            let rn = this.remoteRooms[nsp] = this.remoteRooms[nsp] || {};
            Object.keys(dn).forEach((room) => {
              let dr = dn[room];
              let rr = rn[room] = rn[room] || {};
              Object.keys(dr).forEach((id) => {
                rr[id] = port;
                this.emit('client.add', id, room, nsp);
              });
            });
          });
        } break;
        case 'client.add': {
          let rn = this.remoteRooms[data.nsp] = this.remoteRooms[data.nsp] || {};
          let rr = rn[data.room] = rn[data.room] || {};
          rr[data.id] = port;
          this.emit('client.add', data.id, data.room, data.nsp);
        } break;
        case 'client.del': {
          let rn, rr;
          if (
            (rn = this.remoteRooms[data.nsp]) &&
            (rr = rn[data.room]) &&
            rr[data.id]
          ) {
            delete rr[data.id];
          }
          if (!Object.keys(rr).length) {
            delete rn[data.room];
          }
          if (!Object.keys(rn).length) {
            delete this.remoteRooms[data.nsp];
          }
          this.emit('client.del', data.id, data.room, data.nsp);
        } break;
        case 'client.delAll': {
          let rn = this.remoteRooms[data.nsp];
          if (rn) {
            Object.keys(rn).forEach((room) => {
              let rr = rn[room];
              delete rr[data.id];
              if (!Object.keys(rr).length) {
                delete rn[room];
              }
            });
            if (!Object.keys(rn).length) {
              delete this.remoteRooms[data.nsp];
            }
          }
          this.emit('client.delAll', data.id, data.nsp);
        } break;
        case 'client.broadcast': {
          this.emit('client.broadcast', data.packet, data.opts, data.nsp);
        } break;
        case 'client.rpc_req': {
          this.emit('client.rpc_req', data.id, data.key, data.args, data.nsp, data.uuid, port);
        } break;
        case 'client.rpc_res': {
          this.emit('client.rpc_res', data.succ, data.res, data.uuid);
        } break;
      }
    });
    sock.on('close', () => {
      Object.keys(this.remoteRooms).forEach((nsp) => {
        let rn = this.remoteRooms[nsp];
        Object.keys(rn).forEach((room) => {
          let rr = rn[room];
          Object.keys(rr).forEach((id) => {
            if (rr[id] === port) {
              debug('close delete room member', room, id);
              delete rr[id];
            }
            this.emit('client.del', id, room, nsp);
          });
          if (!Object.keys(rr).length) {
            debug('close delete room', room);
            delete rn[room];
          }
        });
        if (!Object.keys(rn).length) {
          debug('close delete nsp', nsp);
          delete this.remoteRooms[nsp];
        }
      });
      delete this.clientSockets[port];
    });
  }
  add(id, room, fn, nsp) {
    let ln = this.localRooms[nsp] = this.localRooms[nsp] || {};
    let lr = ln[room] = ln[room] || {};
    if (!lr[id]) {
      lr[id] = true;
      let data = {
        action: 'client.add',
        id: id,
        room: room,
        nsp: nsp
      };
      Object.keys(this.clientSockets).forEach((port) => {
        this.clientSockets[port].emit('send', data);
      });
    }
    if (fn) {
      process.nextTick(fn.bind(null, null));
    }
  }
  del(id, room, fn, nsp) {
    let ln, lr;
    if (
      (ln = this.localRooms[nsp]) &&
      (lr = ln[room]) &&
      lr[id]
    ) {
      delete lr[id];
      if (!Object.keys(lr).length) {
        delete ln[room];
      }
      if (!Object.keys(ln).length) {
        delete this.localRooms[nsp]
      }
      let data = {
        action: 'client.del',
        id: id,
        room: room,
        nsp: nsp
      };
      Object.keys(this.clientSockets).forEach((port) => {
        this.clientSockets[port].emit('send', data);
      });
    }
    if (fn) {
      process.nextTick(fn.bind(null, null));
    }
  }
  delAll(id, fn, nsp) {
    let ln = this.localRooms[nsp];
    let broadcast;
    if (ln) {
      Object.keys(ln).forEach((room) => {
        let lr = ln[room];
        if (!lr[id]) {
          return;
        }
        delete lr[id];
        broadcast = true;
        if (!Object.keys(lr).length) {
          delete ln[room];
        }
      });
      if (!Object.keys(ln).length) {
        delete this.localRooms[nsp];
      }
      if (broadcast) {
        let data = {
          action: 'client.delAll',
          id: id,
          nsp: nsp
        };
        Object.keys(this.clientSockets).forEach((port) => {
          this.clientSockets[port].emit('send', data);
        });
      }
    }
    if (fn) {
      process.nextTick(fn.bind(null, null));
    }
  }
  broadcast(packet, opts, nsp) {
    let rn = this.remoteRooms[nsp];
    if (!rn) {
      return;
    }

    let rooms = opts.rooms || [];
    let except = opts.except || [];
    let targets = new Set();
    rooms = rooms.length? rooms: Object.keys(rn);

    rooms.forEach((room) => {
      let rr = rn[room] || {};
      Object.keys(rr).forEach((id) => {
        if (except.indexOf(id) === -1) {
          targets.add(rr[id]);
        }
      });
    });

    if (!targets.size) {
      return;
    }

    let data = {
      action: 'client.broadcast',
      packet: packet,
      opts: opts,
      nsp: nsp
    };

    targets.forEach((port) => {
      this.clientSockets[port].emit('send', data);
    });
  }
  rpcReq(id, key, args, nsp, uuid) {
    let rn = this.remoteRooms[nsp];
    if (!rn) {
      debug('no such remote nsp');
      return;
    }
    let port = (rn[id] || {})[id];
    if (!port) {
      debug('no such remote id', id);
      return;
    }
    let data = {
      action: 'client.rpc_req',
      id: id,
      key: key,
      args: args,
      nsp: nsp,
      uuid: uuid
    };
    this.clientSockets[port].emit('send', data);
  }
  rpcRes(succ, res, uuid, port) {
    let data = {
      action: 'client.rpc_res',
      succ: succ,
      res: res,
      uuid: uuid
    };
    this.clientSockets[port].emit('send', data);
  }
};

module.exports = Client;
