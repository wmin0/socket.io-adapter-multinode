const EventEmitter = require('events');

class Socket extends EventEmitter {
  constructor(sock) {
    super();
    let len = 0;
    let buffer = null;
    sock.on('data', (data) => {
      while(1) {
        if (data.length === 0) {
          break;
        }
        if (buffer) {
          let req = len - buffer.length;
          buffer = Buffer.concat([ buffer, data.slice(0, req) ]);
          data = data.slice(req);
        } else {
          len = data.readInt32BE(0);
          buffer = data.slice(4, 4 + len);
          data = data.slice(4 + len);
        }
        if (buffer.length === len) {
          if (len !== 0) {
            this.emit('recv', JSON.parse(buffer.toString()));
          }
          buffer = null;
          len = 0;
        }
      }
    });

    let lenBuffer = new Buffer(4);
    this.on('send', (data) => {
      data = JSON.stringify(data);
      lenBuffer.writeInt32BE(data.length, 0);
      sock.write(lenBuffer);
      sock.write(data);
    });

    sock.on('close', () => {
      console.log('close');
      this.emit('close');
    });
  }
}

module.exports = Socket;
