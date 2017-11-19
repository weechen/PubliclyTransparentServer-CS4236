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
let betTimeLeft = 30; //sec
let commitTimeLeft = 30; //sec

/**
NOTE: transactions and playerProfile are different. playerProfile is created/updated only at the START(when the user register) and at the END(when the game ends)
*/
//Props of playerProfile
let playerProfile = {
  id:null, //int
  username: '',
  score: null, //int
  socketId:null //int
}

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

    players[socket.id] = createNewPlayerProfile(socket.id, username, 0, socket.id);

    playersJoined++;

    console.log(players);
    
    if(playersJoined >= MAX_NUM_PLAYERS) {
      startGame();
    }
  });

  // socket.emit('bet', { hashSaltedBet: sha256(bet+salt) });
  socket.on('bet', ({ hashSaltedBet }) => {
    if (hashSaltedBet) {
      console.log(`${transactions[socket.id].username} has placed bet of ${hashSaltedBet}`);
      //balance += bet; //NOT SURE WHATS THIS FOR
      transactions[socket.id].bet = hashSaltedBet
    }
  });

  // socket.emit('commit', { commit:{revealedBet, salt} });
  socket.on('commit', ({ commit }) => {
  	if (!transactions[socket.id]) {
  		return console.warn(`${socket.id} does not exist in transactions`);
  	}
  	console.log(`${transactions[socket.id].username} has revealed ${commit.revealedBet}`);
  	
    // assign commit values
  	transactions[socket.id].revealedBet = parseInt(commit.revealedBet, 10);
    transactions[socket.id].salt = commit.salt;

    if(transactions[socket.id].revealedBet != '') {
      hash = crypto.createHmac('sha256', transactions[socket.id].salt)
                   .update( (transactions[socket.id].revealedBet).toString() )
                   .digest('hex');

      transactions[socket.id].revealedHash = hash;
    } else {
      transactions[socket.id].revealedHash = null
    }
  });

  socket.on('getPlayers', ({}) => {
    io.sockets.emit('playersInfo', {players});
  });

  socket.on('restart', ({ isRejoining }) => {
    if(isRejoining) {
      socket.join(game);

      transactions[socket.id] = {}; //create a new transaction for that socket
      transactions[socket.id].username = players[socket.id].username

      /*
      Existing playerProfile ---> players{} never get cleared
      playerProfile = {
        id:<exist>,
        username: <exist>,
        score: <exist>, //int
        socketId: <exist> //int
      }
      */
      playersJoined++;

      console.log(players);
    } else {
      delete players[socket.id];
      console.log(players);
    }
    
    if(playersJoined >= MAX_NUM_PLAYERS) {
      startGame();
    }
  });

  // // socket.emit('guess', { guess: 10 });
  // socket.on('guess', ({ guess }) => {
		// if (!transactions[socket.id]) {
  // 		return console.warn(`${socket.id} does not exist in transactions`);
  // 	}
  // 	console.log(`${transactions[socket.id].username} has submitted guess ${guess}`);
  // 	// check that guess is valid data type
  // 	transactions[socket.id].guess = guess;
  // 	revealSecret();
  // });
});

// to be called on timeout
function revealSecret(){
  //announce first
  io.sockets.emit('processingDecision', {});

  let validTransactions = [];
  let transactionsSize = _.keys(transactions).length;
	let secret = 0;
	_.forEach(transactions, (transaction, id) => {
		let { bet, revealedBet, revealedHash } = transaction;
    if(revealedBet != null) {
      secret += revealedBet % transactionsSize;
    }

    if (revealedHash != null && revealedHash === bet) {
    	transaction.playerId = id; //playerId == socket id
      validTransactions.push(transaction);
		}
	});

	let winners = [];
	_.forEach(validTransactions, (transaction) => {
    let { revealedBet } = transaction;
		if (_.isEqual(revealedBet, secret)) {
      players[transaction.playerId].score++; //raise the score
			winners.push({id:transaction.playerId , username: transaction.username}); //push the winner name
		}
	});

  io.in(game).emit('results', { data: {secret: secret, winners: winners} });

  resetGame();
}

function startGame() {
  io.sockets.emit('startBetSession', {players}); //emit 'startGame' event to everyone connected to the server socket
  startBetTimer();
}

function resetGame() {
  playersJoined = 0;

	transactions = {};
	let oldGame = game;
	game = _.random(5000);
	while (game === oldGame) {
		game = _.random(5000);
	}
}

function startBetTimer() {
  var intervalRunner = setInterval(function() {  
    betTimeLeft--;
    if(betTimeLeft <= 0) {
      clearInterval(intervalRunner);
      startCommitSession();
    }
    io.sockets.emit('betTimeUpdate', { countdown: betTimeLeft });
  }, 1000); //every sec, update the bettime
}

function startCommitSession() {
  io.sockets.emit('startCommitSession', {});
  startCommitTimer();
}

function startCommitTimer() {
  var intervalRunner = setInterval(function() {  
    commitTimeLeft--;
    if(commitTimeLeft <= 0) {
      clearInterval(intervalRunner);
      revealSecret();
    }
    io.sockets.emit('commitTimeUpdate', { countdown: commitTimeLeft });
  }, 1000); //every sec, update the bettime
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

