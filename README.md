# tcpviaws

Simple proxy server that connects websockets to TCP. Allows a web browser to talk to a raw TCP service via websockets.

Install:

    npm install -g tcpviaws

## Node usage

    tcpviaws [wshost:]wsport tcphost:tcpport

Example:

    tcpviaws 8080 localhost:4567
    tcpviaws 127.0.0.1:8080 localhost:4567


