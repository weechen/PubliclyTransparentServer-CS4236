const express = require('express');
const socketio = require('socket.io');
const _ = require('lodash');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000

const app = express();

const server = app.listen(PORT, function () {
  console.log('Listening on port 3000')
});

/*** FINAL ***/
let MAX_NUM_PLAYERS = 2;

/*** CONTROLLED ***/
let game = 123;	// rand int, changed when game ends (i.e.:Random game session everytime)
let balance = 0;
let transactions = {};
let playersJoined = 0;

let _id = 0;
/**
NOTE: transactions and playerProfile is different. playerProfile is created/updated only at the START(when the user register) and at the END(when the game ends)
*/
//Props of playerProfile
let playerProfile = {
  id:null, //int
  username: '',
  score: null, //int
  socketId:null //int
}

/**
players = {
  id1: {playerProfile},
  id2: {playerProfile},
  ...
}
*/
let players = {};

const io = socketio.listen(server);
io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  // socket.emit('register', { username : 'alice'} });
  socket.on('register', ({ username }) => {
  	console.log(`${socket.id} has been registered as ${username}`);
    socket.join(game);
    transactions[socket.id] = {};
    transactions[socket.id].username = username

    players[_id] = createNewPlayerProfile(_id, username, 0, socket.id);
    _id++;
    playersJoined++;

    console.log(players);

    let salt = crypto.randomBytes(256);
    salt = salt.toString('base64');
    console.log(salt);
    
    if(playersJoined >= MAX_NUM_PLAYERS) {
      io.sockets.emit('startGame', {players}); //emit 'startGame' event to everyone connected to the server socket
      startGame();
    }
  });

  // socket.emit('bet', { bet: 10 });
  socket.on('bet', ({ bet }) => {
    if (bet && _.isSafeInteger(bet) && bet > 0) {
      console.log(`${transactions[socket.id].username} has placed bet of ${bet}`);
      balance += bet;
    }
  });

  // socket.emit('commit', { commit: 10 });
  socket.on('commit', ({ commit }) => {
  	if (!transactions[socket.id]) {
  		return console.warn(`${socket.id} does not exist in transactions`);
  	}
  	console.log(`${transactions[socket.id].username} has submitted commit ${commit}`);
  	// check that commit is valid data type
  	transactions[socket.id].commit = commit;
  });

  // socket.emit('guess', { guess: 10 });
  socket.on('guess', ({ guess }) => {
		if (!transactions[socket.id]) {
  		return console.warn(`${socket.id} does not exist in transactions`);
  	}
  	console.log(`${transactions[socket.id].username} has submitted guess ${guess}`);
  	// check that guess is valid data type
  	transactions[socket.id].guess = guess;
  	revealSecret();
  });
});

// to be called on timeout
function revealSecret(){
  let validTransactions = [];
  let transactionsSize = _.keys(transactions).length;
	let secret = 0;
	_.forEach(transactions, (transaction, id) => {
		let { guess, commit } = transaction;
		if (typeof (guess) !== 'undefined') {
      secret += transaction.guess % transactionsSize;
      if (sha3(transaction.guess) === sha3(transaction.commit)) {
      	transaction.playerId = id;
        validTransactions.push(transaction);
			}
		}
	});

	let winners = [];
	_.forEach(validTransactions, (transaction) => {
		if (_.isEqual(transaction.guess, secret)) {
			winners.push(transaction.playerId);
		}
	});

	if (_.isEmpty(winners)) {
  	io.in(game).emit('results', { message: `No winners for this round, secret was ${secret}` });
	}
	else {
  	io.in(game).emit('results', { message: `Winners are ${winners}, secret was ${secret}` });
	}
	// delete room
	resetGame();
}

function startGame() {
  StartBetTimer();
}

function resetGame() {
	transactions = {};
	let oldGame = game;
	game = _.random(5000);
	while (game === oldGame) {
		game = _.random(5000);
	}
}

function StartBetTimer() {
  var betTimeLeft = 30;

  setInterval(function() {  
    betTimeLeft--;
    io.sockets.emit('betTimeUpdate', { countdown: betTimeLeft });
  }, 1000); //every sec, update the bettime
}

function sha3(val) {
	return val;	// dummy
}

function createNewPlayerProfile(playerId, username, score, socketId) {
  toReturn = null;

  if(!playerExists(playerId)) {
    playerProfile = {}
    
    playerProfile.id = playerId;
    playerProfile.username = username;
    playerProfile.score = score;
    playerProfile.socketId = socketId;

    toReturn = playerProfile;
  }

  return toReturn;
}

function playerExists(playerId) {
  return playerId.toString() in players;
}

//Returns the player if exists, else return {}
function getPlayerProfile(playerId) {
  return players[playerId];
}

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index', {
    serverInfo: {
      serverAddr: server.address().address, 
      serverPort: server.address().port
    }
  });
});

