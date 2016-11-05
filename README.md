# socket.io-adapter-multinode

## run example

1. prepare

	$ npm install
	$ cd ./example
	$ npm install

2. open server

	$ cd ./example
	$ ./server.sh 9001

3. open client1

	$ cd ./example
	$ ./client.sh 3001 10001 9001

4. open client2

	$ cd ./example
	$ ./client.sh 3002 10002 9001

5. open browser http://localhost:3001 & http://localhost:3002 and play!, result will be printed in develop console
