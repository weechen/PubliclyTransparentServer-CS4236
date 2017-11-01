
var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000')
socket.on('results', ({message}) => {console.log(message)});

// To register as a player as alice
socket.emit('register', { username: 'alice' });

// To send in a bet of value 5
socket.emit('bet', { bet: 5 });

// To send in commit of value 10
socket.emit('commit', { commit: 0 });

// To send in guess of value 10
socket.emit('guess', { guess: 0 });
