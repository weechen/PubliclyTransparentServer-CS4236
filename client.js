var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000')
socket.on('results', ({message}) => {console.log(message)});

// To register as a player + send in bet of $5
socket.emit('register', { bet: 5 });

// To send in commit of value 10
socket.emit('commit', { commit: 10 });

// To send in guess of value 10
socket.emit('guess', { guess: 10 });
