#!/usr/bin/env bash

npm run client \
--socket.io-adapter-multinode-example:web_port=$1 \
--socket.io-adapter-multinode-example:local_port=$2 \
--socket.io-adapter-multinode-example:server_port=$3
