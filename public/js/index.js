$(function () {
    window.PTSController = (function() {
    	
    	/******** CONTROLLED VARIABLES ********/
        var _initialized = false;
        var _socket = null;
        var _serverAddr = null;
        var _serverPort = null;
        var _salt = null;
        var _id = null;

        /********** FINALS ***********/
        var ERROR_TYPES = {
        	"ERROR_TYPE_1" : "EMPTY_USER_NAME",
        	"ERROR_TYPE_2" : "EXIST_USER_NAME",
        	"ERROR_TYPE_3" : "EMPTY_BET"
        }

        var WARN_TYPES = {
        	"WARN_TYPE_1" : "OTHERS_JOINING",
        	"WARN_TYPE_2" : "SERVER_RESPONSE"
        }

        /******** DOM OBJECTS ********/
        var $header = $('.header');
        var $audios = $('.audios');

        //Buttons
        var $beginButton = $('.begin-btn');
        var $registerButton = $('.register-btn');
        var $betButton = $('.place-bet-btn');
        var $commitButton = $('.commit-btn');

        //Components / Sections
        var $registerComponent = $('.register-component');
        var $betComponent = $('.bet-component');
        var $playersTable = $('.players-table');
        var $playersList = $('.players-list');
        var $betTimeLeftComponent = $('.bet-time-left-component');
        var $commitComponent = $('.commit-component');
        var $commitTimeLeftComponent = $('.commit-time-left-component');
        var $outcomeComponent = $('.outcome-component');
        var $outcome = $('.outcome');
        var $winner = $('.win');
        var $loser = $('.lose');
        var $noWinners = $('#no-winners')

        //Input DOMs
        var $input_username = $('#username-input');
        var $input_bet = $('#bet-input');
        var $input_commit = $('#commit-input');

        //countdown DOMS
        var $betTimeLeft = $('#betTimeLeft');
        var $commitTimeLeft = $('#commitTimeLeft');

        //Error DOMs
        var $all_errors = $('.error-message');
        var $empty_username = $('#empty-username-error');
        var $exist_username = $('#username-exist-error');
        var $empty_bet = $('#empty-bet-error');

        //Warning DOMs
        var $all_warnings = $('.warning-message');
        var $waiting_others = $('#wait-others-warning');
        var $processing = $('#processing-warning');

        //Update Display DOMs
        var $betTimeLeft = $('#betTimeLeft');


        /***********************************************
        *************** IO CONNECT *********************
        ************************************************/
        var connectToServer = function() {
        	_socket = io.connect(`http://${_serverAddr}:${_serverPort}`);
        	if(_socket.connected) {
        		console.log("connected to Game Server");
        	}
        }

        /***********************************************
        ***** EVENTS HANDLERS (SOCKET.IO EVENTS) *******
        ************************************************/
        var initEventListners = function() {
        	_socket.on('startBetSession', function (data) { //data = {players: {players object}} object
        		createPlayersTable(data.players)
        		$playersTable.removeClass('hidden');
				
				clearWarnings();
				
				initBetComponent();
			    //socket.emit('my other event', { my: 'data' });
			});

			_socket.on('betTimeUpdate', function(data){ //data = {countdown: time value} object
				console.log(data.countdown);
				updateCountDownTimerDisplay(data.countdown);
			});

            _socket.on('startCommitSession', function(data){ //data = {}
                clearErrors();
                clearWarnings();

                $betComponent.addClass('hidden');
                $betTimeLeftComponent.addClass('hidden');
                initCommitComponent();
            });

            _socket.on('commitTimeUpdate', function(data){ //data = {countdown: time value} object
                updateCommitCountDownTimerDisplay(data.countdown);
            });

            _socket.on('processingDecision', function(data){ //data = {countdown: time value} object
                clearErrors();
                clearWarnings();

                $commitComponent.addClass('hidden');
                $commitTimeLeftComponent.addClass('hidden');
                $playersTable.addClass('hidden')

                $processing.removeClass('hidden');
            });

            _socket.on('results', function(data){ //data = {secret, winners[] } object
                announceResult(data.data);
            });
        }

		/***********************************************
        *********** PROCESS/HELPER FUNCTIONS ***********
        ************************************************/
        var processRegistration = function() {
        	var chosenUsername = $input_username.val();

        	if(!chosenUsername) {
        		showError(ERROR_TYPES["ERROR_TYPE_1"]);
        		return;
        	}

        	clearErrors();

        	_socket.emit('register', { username: chosenUsername });

        	$registerComponent.addClass('hidden');

        	showWarning(WARN_TYPES["WARN_TYPE_1"]);
        }

        var initBetComponent = function() {
        	$betComponent.removeClass('hidden');

        	$betTimeLeftComponent.removeClass('hidden');
        }

        var initCommitComponent = function() {
            $commitComponent.removeClass('hidden');
            $commitTimeLeftComponent.removeClass('hidden');
        }

        var createPlayersTable = function(players) {
        	playersInfo = "";

        	for (var playerId in players) {
			    if (players.hasOwnProperty(playerId)) {
			        playersInfo +=  
			        "<div class='player-entry margin-right-m'>"+
			        	"<p>"+players[playerId].username+"</p>"+
			        	"<p>"+players[playerId].score+"</p>"+
			        "</div>";
			    }
			}

			$playersList.append(playersInfo);
        }

        var placeBet = function() {
        	var placedBet = $input_bet.val();

        	if(!placedBet) {
        		showError(ERROR_TYPES["ERROR_TYPE_3"]);
        		return;
        	}

        	$audios[1].play();

            //generate new salt for every new Bet
            _salt = CryptoJS.lib.WordArray.random(128/8).toString();

            //Hash the saltedBet using SHA256
            var hash_saltedBet = CryptoJS.HmacSHA256(placedBet.toString(), _salt).toString()

            //send hash_saltedBet to the server
            _socket.emit('bet', { hashSaltedBet: hash_saltedBet });
        }

        var revealBet = function() {
            var revealedBet = $input_commit.val();

            //send hash_saltedBet to the server
            _socket.emit(
                'commit', 
                { 
                    commit: {
                        salt: _salt,
                        revealedBet: revealedBet
                    } 
                }
            );
        }

        var announceResult = function(result) {
            setTimeout(function(){
                $processing.addClass("hidden");
            }, 3000);

            setTimeout(function(){
                var decided = false;
                if(result.winners.length > 0) {
                    for (var key in result.winners) {
                        var winner = result.winners[key];
                        console.log(_id)
                        console.log(winner.id == _id)
                        if(winner.id == _socket.id) {
                            showOutcome(true, result.secret)
                            decided = true;
                        } 
                    }
                    if(!decided) {
                        showOutcome(false, result.secret)
                    }
                } else {
                    $noWinners.removeClass('hidden');
                }
            }, 3000);
        }

        var showOutcome = function(didWin, secret) {
            $outcomeComponent.removeClass('hidden');
            if(didWin) {
                $winner.removeClass('hidden');
            } else {
                $loser.removeClass('hidden');
            }

            $outcome.html(secret);
        }

        var updateCountDownTimerDisplay = function(timeLeft) {
        	$betTimeLeft.html(timeLeft);
        }

        var updateCommitCountDownTimerDisplay = function(timeLeft) {
            $commitTimeLeft.html(timeLeft);
        }

        var showError = function(ERROR_TYPE_VAL) {
        	switch(ERROR_TYPE_VAL) {
        		case ERROR_TYPES["ERROR_TYPE_1"]:
        			$empty_username.removeClass('hidden');
        			break;
        		case ERROR_TYPES["ERROR_TYPE_2"]:
        			$exist_username.removeClass('hidden');
        			break;
    			case ERROR_TYPES["ERROR_TYPE_3"]:
    				$empty_bet.removeClass('hidden');
        			break;
        		default:
        			break;
        	}
        }

        var clearErrors = function() {
        	$all_errors.each(function() {
        		$(this).addClass('hidden');
        	})
        }

        var showWarning = function(WARN_TYPE_VAL) {
        	switch(WARN_TYPE_VAL) {
        		case WARN_TYPES["WARN_TYPE_1"]:
        			$waiting_others.removeClass('hidden');
        			break;
        		case WARN_TYPES["WARN_TYPE_2"]:
        			$exist_username.removeClass('hidden');
        			break;
        		default:
        			break;
        	}
        }

        var clearWarnings = function() {
        	$all_warnings.each(function() {
        		$(this).addClass('hidden');
        	})
        }

        /***********************************************
        ******* EVENTS HANDLERS (JQUERY EVENTS) ********
        ************************************************/
        var attachMouseEnterAudios = function() {
            $beginButton.mouseenter(function() {
                $audios[0].play();
            });

            $registerButton.mouseenter(function() {
                $audios[0].play();
            });

            $betButton.mouseenter(function() {
                $audios[0].play();
            });
        }

        var attachClickHandlers = function() {
            $beginButton.on('click', function() {
                $registerComponent.removeClass('hidden');
                $beginButton.addClass('hidden');
            })

            $registerButton.on('click', function() {
                processRegistration();
            })

            $betButton.on('click', function() {
                placeBet();
            })

            $commitButton.on('click', function() {
                revealBet();
            })

        }

        /***********************************************
        *************** INIT CONTROLLER ****************
        ************************************************/
    	var init = function(initObject) {
    		if(_initialized) {
    			return true;
    		}

    		_initialized = true;
    		
    		_serverAddr = initObject.serverAddr == "::" ? "localhost" : initObject.serverAddr;
    		_serverPort = initObject.serverPort;

    		connectToServer();
    		initEventListners();

    		attachMouseEnterAudios();
    		attachClickHandlers();
    	}

    	return {
            'init': init
        }
    })();
});

//		var socket = io.connect('http://localhost:3000')
