# socket.io-adapter-multinode

## run example

* prepare
```bash
npm install
cd ./example
npm install
```

* open server
```bash
cd ./example
./server.sh 9001
```

* open client1
```bash
cd ./example
./client.sh 3001 10001 9001
```

* open client2
```bash
cd ./example
./client.sh 3002 10002 9001
```

* open browser http://localhost:3001 & http://localhost:3002 and play!, result will be printed in develop console
