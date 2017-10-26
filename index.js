const express = require('express');
const socketio = require('socket.io');
const _ = require('lodash');

const PORT = process.env.PORT || 3000

const app = express();

const server = app.listen(PORT, function () {
  console.log('Listening on port 3000')
});

let game = 123;	// rand int, changed when game ends
let balance = 0;
let transactions = {};

const io = socketio.listen(server);
io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  // socket.emit('register', { bet: 5 });
  socket.on('register', ({ bet }) => {
  	if (bet && _.isSafeInteger(bet) && bet > 0) {
    	console.log(`${socket.id} has been registered and placed bet of ${bet}`);
      socket.join(game);
      transactions[socket.id] = {};
      balance += bet;
  	}
  });

  // socket.emit('commit', { commit: 10 });
  socket.on('commit', ({ commit }) => {
  	if (!transactions[socket.id]) {
  		return console.warn(`${socket.id} does not exist in transactions`);
  	}
  	console.log(`${socket.id} has submitted commit ${commit}`);
  	// check that commit is valid data type
  	transactions[socket.id].commit = commit;
  });

  // socket.emit('guess', { guess: 10 });
  socket.on('guess', ({ guess }) => {
		if (!transactions[socket.id]) {
  		return console.warn(`${socket.id} does not exist in transactions`);
  	}
  	console.log(`${socket.id} has submitted guess ${guess}`);
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
  response.render('pages/index');
});

