const serverPort = parseInt(process.env.npm_package_config_server_port, 10);
const Server = require('socket.io-adapter-multinode').Server;
new Server(serverPort);
