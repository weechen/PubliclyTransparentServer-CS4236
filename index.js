const express = require('express');
const socketio = require('socket.io');
const _ = require('lodash');

const PORT = process.env.PORT || 3000

const app = express();

const server = app.listen(PORT, function () {
  console.log('Listening on port 3000')
});

/*** FINAL ***/
let MAX_NUM_PLAYERS = 5;

let game = 123;	// rand int, changed when game ends
let balance = 0;
let transactions = {};
let playersJoined = 0;

const io = socketio.listen(server);
io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  // socket.emit('register', { username: alice });
  socket.on('register', ({ username }) => {
  	console.log(`${socket.id} has been registered as ${username}`);
    socket.join(game);
    transactions[socket.id] = {};
    transactions[socket.id].username = username
    playersJoined++;

    if(playersJoined == MAX_NUM_PLAYERS) {
      socket.emit('startGame', {});
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


function resetGame() {
	transactions = {};
	let oldGame = game;
	game = _.random(5000);
	while (game === oldGame) {
		game = _.random(5000);
	}
}

function sha3(val) {
	return val;	// dummy
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

