const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const adapter = require('socket.io-adapter-multinode').adapter;
const Client = require('socket.io-adapter-multinode').Client;
const io = socketio(server);

const serverPort = parseInt(process.env.npm_package_config_server_port, 10);
const webPort = parseInt(process.env.npm_package_config_web_port, 10);
const localPort = parseInt(process.env.npm_package_config_local_port, 10);

io.adapter(adapter(new Client(serverPort, localPort)));

app.use(express.static(path.join(__dirname, 'public')));
server.listen(webPort, () => {
  console.log('http listening');
});

io.on('connection', (sock) => {
  console.log('http connect');
  sock.on('test1', () => {
    console.log('test1');
    sock.join('test room');
  });
  sock.on('test2', () => {
    console.log('test2');
    sock.broadcast.to('test room').emit('msg', 'test2');
  });
  sock.on('test3', () => {
    console.log('test3');
    io.to('test room').emit('msg', 'test3');
  });
  sock.on('test4', () => {
    console.log('test4');
    io.sockets.emit('msg', 'test4');
  });
  sock.on('test5', () => {
    console.log('test5');
    sock.leave('test room');
  });
});
