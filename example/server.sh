#!/usr/bin/env bash

if (( $# < 1 )); then
  echo $0 server_port
  exit 1
fi

DEBUG=multinode:* \
npm run server \
--socket.io-adapter-multinode-example:server_port=$1
