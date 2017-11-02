$(function () {
    window.PTSController = (function() {
    	
    	/******** CONTROLLED VARIABLES ********/
        var _initialized = false;
        var _socket = null;
        var _serverAddr = null;
        var _serverPort = null;

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
        var $audios = $('#audios');

        //Buttons
        var $beginButton = $('.begin-btn');
        var $registerButton = $('.register-btn');
        var $betButton = $('.place-bet-btn');

        //Components / Sections
        var $registerComponent = $('.register-component');
        var $betComponent = $('.bet-component');

        //Input DOMs
        var $input_username = $('#username-input');
        var $bet = $('#bet-input');

        //Error DOMs
        var $all_errors = $('.error-message');
        var $empty_username = $('#empty-username-error');
        var $exist_username = $('#username-exist-error');
        var $empty_bet = $('#empty-bet-error');

        //Warning DOMs
        var $all_warnings = $('.warning-message');
        var $waiting_others = $('#wait-others-warning');


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
        	_socket.on('startGame', function (data) {
				clearWarnings();
				initBetComponent();
			    //socket.emit('my other event', { my: 'data' });
			});
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
        }

        var attachClickHandlers = function() {
        	$beginButton.on('click', function() {
        		$registerComponent.removeClass('hidden');
        		$beginButton.addClass('hidden');
        	})

        	$registerButton.on('click', function() {
        		processRegistration();
        	})
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

        	showWaiting(WARN_TYPES["WARN_TYPE_1"]);
        }

        var initBetComponent = function() {

        }

        var showError = function(ERROR_TYPE_VAL) {
        	switch(ERROR_TYPE_VAL) {
        		case ERROR_TYPES["ERROR_TYPE_1"]:
        			$empty_username.removeClass('hidden');
        			break;
        		case ERROR_TYPES["ERROR_TYPE_2"]:
        			$exist_username.removeClass('hidden');
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

        var showWaiting = function(WARN_TYPE_VAL) {
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
