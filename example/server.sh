#!/usr/bin/env bash

npm run server \
--socket.io-adapter-multinode-example:server_port=$1
