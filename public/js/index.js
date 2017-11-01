$(function () {
    window.PTSController = (function() {
    	//Private variable
        var _initialized = false;
        var _socket = null;
        var _serverAddr = null;
        var _serverPort = null;

        //DOM objects
        var $header = $('.header');
        var $audios = $('#audios');

        var $beginButton = $('.begin-btn');
        var $registerButton = $('.register-btn');

        var $registerComponent = $('.register-component');

        var $input_username = $('#username-input');

        var connectToServer = function() {
        	_socket = io.connect(`http://${_serverAddr}:${_serverPort}`);
        	
        	if(_socket.connected) {
        		console.log("connected to Game Server");
        	}
        }

        var initEventListners = function() {
        	_socket.on('news', function (data) {
				console.log(data);
			    socket.emit('my other event', { my: 'data' });
			});
        }

        var attachHoverHandlers = function() {
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
        }

    	var init = function(initObject) {
    		if(_initialized) {
    			return true;
    		}

    		_initialized = true;
    		
    		_serverAddr = initObject.serverAddr == "::" ? "localhost" : initObject.serverAddr;
    		_serverPort = initObject.serverPort;

    		connectToServer();
    		initEventListners();

    		attachHoverHandlers();
    		attachClickHandlers();
    	}

    	return {
            'init': init
        }
    })();
});

//		var socket = io.connect('http://localhost:3000')
