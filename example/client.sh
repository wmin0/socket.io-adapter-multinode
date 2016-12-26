#!/usr/bin/env bash

if (( $# < 3 )); then
  echo $0 web_port local_port server_port
  exit 1
fi

DEBUG=multinode:* \
npm run client \
--socket.io-adapter-multinode-example:web_port=$1 \
--socket.io-adapter-multinode-example:local_port=$2 \
--socket.io-adapter-multinode-example:server_port=$3
