const net = require('net');
const Socket = require('./socket');
const EventEmitter = require('events');
const debug = require('debug')('multinode:server');

class Server extends EventEmitter {
  constructor(serverPort) {
    super();
    this.clientSockets = {};
    this.server = net.createServer((s) => {
      let sock = new Socket(s);
      let port = null;
      sock.on('recv', (data) => {
        debug('server recv', data);
        switch (data.action) {
          case 'server.reg': {
            sock.emit('send', {
              action: 'server.reg',
              ports: Object.keys(this.clientSockets)
            });
            this.clientSockets[port = data.port] = sock;
          } break;
        }
      });
      sock.on('close', () => {
        delete this.clientSockets[port];
      });
    });
    this.server.listen(serverPort, () => {
      debug('server listening');
    });
  }
};

module.exports = Server;
