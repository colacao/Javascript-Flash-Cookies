/**
* SwfStore by Nathan Friedly http://nfriedly.com
*
* http://github.com/nfriedly/Javascript-Flash-Cookies
*/

(function(){
	var counter = 0; // a counter for element id's and whatnot
	
	var alpnum = /[^a-z0-9_]/ig; //a regex to find anything thats not letters and numbers
	
	function checkData(data){
		if(typeof data == "function"){
			throw 'SwfStore Error: Functions cannot be used as keys or values.';
		}
	}

 	window.SwfStore = function(config){
		this.config = config;
		var namespace = this.namespace = config.namespace.replace(alpnum, '_') || "swfstore",
			debug = config.debug || false
			timeout = config.timeout || 60; // how long to wait before assuming the store.swf failed to load (in seconds)
	
		// a couple of basic timesaver functions
		function id(){
			return "SwfStore_" + namespace + "_" +  (counter++);
		}
		
		function div(visible){
			var d = document.createElement('div');
			document.body.appendChild(d);
			d.id = id();
			if(!visible){
				// setting display:none causes the .swf to not render at all
				d.style.position = "absolute";
				d.style.top = "0px";
				d.style.left = "-2000px";
			}
			return d;
		}
	
		// get a logger ready if appropriate
		if(debug){
			// if we're in a browser that doesn't have a console, build one
			if(typeof console == "undefined"){
				var logerOutput = div();
				window.console = {
					log: function(msg){
						var m = div();
						m.innerHTML = msg;
						loggerOutput.appendChild(m);
					}
				};
			}
			this.log = function(type, source, msg){
				source = (source == 'swfStore') ? 'swf' : source;
				console.log('SwfStore - ' + namespace + ": " + type + ' (' + source  + '): ' + msg);
			}
		} else {
			this.log = function(){}; // if we're not in debug, then we don't need to log anything
		}
	
		this.log('info','js','Initializing...');
	
		// the callback functions that javascript provides to flash must be globally accessible
		SwfStore[namespace] = this;
	
		var swfContainer = div(debug);
		
		var swfName = id();
		
		var flashvars = "logfn=SwfStore." + namespace + ".log&amp;" + 
			"onload=SwfStore." + namespace + ".onload&amp;" +  // "onload" sets this.ready and then calls the "onready" config option
			"onerror=SwfStore." + namespace + ".onerror";
			
		swfContainer.innerHTML = 
			'<object height="100" width="500" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" id="' + 
			swfName + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
			'	<param value="' + config.swf_url + '" name="movie">' + 
			'	<param value="' + flashvars + '" name="FlashVars">' +
			'	<param value="always" name="allowScriptAccess">' +
			'	<embed height="375" align="middle" width="500" pluginspage="http://www.macromedia.com/go/getflashplayer" ' +
			'flashvars="' + flashvars + '" type="application/x-shockwave-flash" allowscriptaccess="always" quality="high" loop="false" play="true" ' +
			'name="' + swfName + '" bgcolor="#ffffff" src="' + config.swf_url + '">' +
			'</object>';
		
		this.swf = 	document[swfName] || window[swfName];
		
		this._timeout = setTimeout(function(){
			SwfStore[namespace].log('Timeout reached, assuming the store.swf failed to load and firing the onerror callback.');
			if(config.onerror){
				config.onerror();
			}
		}, timeout * 1000);
	}

	SwfStore.prototype = {
		ready: false, //is the swfStore initialized?
		
		namespace: 'SwfStore_prototype',

		"set": function(key, value){
			if(this.namespace === SwfStore.prototype.namespace ){
				throw 'Create a new SwfStore to set data';
			}
			if(this.ready){
				checkData(key);
				checkData(value);
				//this.log('debug', 'js', 'Setting ' + key + '=' + value);
				return this.swf.set(key, value);
			} else {
				throw 'Attempted to save to uninitialized SwfStore.';
			}
		},
	
		"get": function(key){
			if(this.namespace === SwfStore.prototype.namespace ){
				throw 'Create a new SwfStore to set data';
			}
			if(this.ready){
				checkData(key);
				//this.log('debug', 'js', 'Reading ' + key);
				return this.swf.get(key);
			} else {
				throw 'Attempted to read from an uninitialized SwfStore.';
			}
		},
		
		"onload": function(){
			clearTimeout(this._timeout);
			this.ready = true;
			//this.log('info', 'js', 'Ready!')
			if(this.config.onready){
				this.config.onready();
			}
		},
		
		"onerror": function(){
			clearTimeout(this._timeout);
			//this.log('info', 'js', 'Error reported by storage.swf');
			if(this.config.onerror){
				this.config.onerror();
			}
		}
		
	}
}())