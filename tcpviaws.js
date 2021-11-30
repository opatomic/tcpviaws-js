#!/usr/bin/env node

"use strict";

var libnet = require('net');
var libws = require('ws');


function connectTcp(wsconn, state, host, port) {
	var tcpconn = libnet.connect(port, host, function() {
		console.log("connected to tcp " + host + ":" + port);
		state.tcpconnected = true;
	});
	tcpconn.setNoDelay(true);
	tcpconn.on("data", function(data) {
		wsconn.send(data);
	});
	tcpconn.on("error", function(e) {
		console.log("tcp conn error: " + e);
		// node docs say that close event will occur after this event; therefore, do nothing else here
	});
	tcpconn.on("end", function() {
		if (state.wsconnected) {
			console.log("recv FIN from tcp conn");
			wsconn.close();
		}
	});
	tcpconn.on("close", function() {
		state.tcpconnected = false;
		if (state.wsconnected) {
			console.log("tcp conn closed; closing ws");
			wsconn.close();
		}
	});
	return tcpconn;
}

function initWsServer(server, destHost, destPort) {
	server.on("connection", function(wsconn) {
		var state = {
			"wsconnected": true,
			"tcpconnected": false,
		};
		var tcpconn = connectTcp(wsconn, state, destHost, destPort);
		wsconn.on("message", function(msg) {
			tcpconn.write(msg);
		});
		wsconn.on("error", function(e) {
			console.log("ws conn err: " + e);
			wsconn.close();
		});
		wsconn.on("close", function(code, reason) {
			state.wsconnected = false;
			if (state.tcpconnected) {
				console.log("ws conn initiated close; closing tcp conn");
				tcpconn.end();
			}
		});
	});
	server.on("error", function(e) {
		console.log("ws server error: " + e);
	});
}

function parseHostPort(s) {
	var idx = s.lastIndexOf(":");
	if (idx >= 0) {
		return [s.substring(0, idx), parseInt(s.substring(idx + 1))];
	}
	return ["localhost", parseInt(s)];
}


if (process.argv.length < 4) {
	console.error("tcpviaws [wshost:]wsport [tcphost:]tcpport\n  where wshost and tcphost will default to localhost if unspecified");
	process.exit(2);
}

var src = parseHostPort(process.argv[2]);
var dst = parseHostPort(process.argv[3]);

var options = {
	host : src[0],
	port : src[1]
};

var server = new libws.Server(options);
initWsServer(server, dst[0], dst[1]);

console.log("Listening for websockets at " + src[0] + ":" + src[1] + "; Sending traffic to TCP addr " + dst[0] + ":" + dst[1]);


