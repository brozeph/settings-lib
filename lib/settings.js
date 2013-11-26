var
	fs = require('fs'),

	async = require('async'),

	defaultOptions = {
		baseConfigPath : '',
		environmentSearchPaths : ['./', './config', './settings'],
		commandLineSwitches : ['--config-file'],
		readEnvironmentMap : {},
		readCommandLineMap : {}
	};


/* *
 * Creates a new object and merges multiple objects together,
 * each subsequent object having priority
 *
 * @param objects = accepts array of objects
 * @param callback = function (err, clonedObject)
 * */
function cloneAndMerge(objects, callback) {
	'use strict';

	if (!Array.isArray(objects)) {
		return callback(null, objects);
	}

	var
		cloned = {},
		cloner = function (source, destination) {
			Object.keys(source).forEach(function (key) {
				if (Object.prototype.toString.call(source[key]) === '[object Array]') {
					destination[key] = source[key];
				} else if (typeof source[key] === 'object' && source[key] !== null) {
					destination[key] = cloner(source[key], destination[key] || {});
				} else {
					destination[key] = source[key];
				}
			});

			return destination;
		};

	objects.forEach(function (item) {
		if (typeof item === 'object') {
			cloned = cloner(item, cloned);
		}
	});

	return callback(null, cloned);
}


/**
 * Creates a new object based on an expression representing a single field
 * in an object and applies specified value
 *
 * @param expression = string Javascript expression
 * @param value = value to assign to the end result of the expression
 **/
function createObjectWithValue(expression, value) {
	'use strict';

	var
		current,
		keys = [],
		// matches ], '], "], ][, '][', "][", [, [' and ["
		regexHash = /([\'\"]?\]\[[\'\"]?)|(\[[\'\"]?)|([\'\"]?\])/g,
		stack = {},
		atEnd = function (keys, key) {
			return keys.indexOf(key) === keys.length - 1;
		};

	if (expression) {
		// breaks the expression into an array which represents its stack
		expression
			.split(regexHash)
			.forEach(function (key) {
				if (key && !key.match(regexHash)) {
					keys.push(key);
				}
			});

		// in the event hash notation was not used, but periods were...
		if (keys.length === 1) {
			keys = keys[0].split('.');
		}

		// create an object graph representing string based script notation
		keys.forEach(function (key) {
			if (!current) {
				current = stack;
			}

			current[key] = atEnd(keys, key) ? value : {};
			current = current[key];
		});
	}

	return stack;
}


/* *
 * Loads JSON configuration data from a text file
 *
 * @param path = path to JSON configuration file
 * @param callback = function (err, configContent)
 * */
function getConfigFileContents(path, callback) {
	'use strict';

	var contents;

	fs.readFile(path, function (err, data) {
		if (err) {
			return callback(err);
		}

		if (data) {
			try {
				contents = JSON.parse(data);
			} catch (ex) {
				return callback(ex);
			}
		}

		return callback(null, contents);
	});
}


/* *
 * Primary class
 *
 *
 * */
module.exports = (function (settings) {
	'use strict';

	function combineConfig(callback) {
		cloneAndMerge([
				settings.baseConfig || {},
				settings.environmentConfig || {},
				settings.commandLineConfig || {}
			],
			function (err, result) {
				settings.config = result;
				return callback(err);
			});
	}

	function getOptions(options) {
		return function (callback) {
			cloneAndMerge(
				[defaultOptions, options],
				function (err, options) {
					if (err) {
						return callback(err);
					}

					// real work begins here
					settings.options = options;
					return callback();
				});
		};
	}

	function loadBaseConfig(callback) {
		if (settings.options.baseConfigPath) {
			getConfigFileContents(
				settings.options.baseConfigPath,
				function (err, contents) {
					if (err) {
						return callback(err);
					}

					settings.baseConfig = contents;
					return callback();
				});
		} else {
			settings.baseConfig = {};
			return callback();
		}
	}

	function loadCommandLineConfig(callback) {
		var
			arg,
			args = process.argv.slice(2), // removes node command
			commandLineConfigPath,
			i = 0;

		// no sense in doing this routine if no command line switches are configured
		if (!Array.isArray(settings.options.commandLineSwitches) ||
			settings.options.commandLineSwitches.length < 1) {
			return callback();
		}

		// iterate args from command line
		for (; i < args.length; i++) {
			arg = args[i];

			if (arg &&
				settings.options.commandLineSwitches.indexOf(arg) !== -1 &&
				args.length >= i + 1) {
				commandLineConfigPath = args[i + 1];
				break;
			}
		}

		// if a path was identified, load it
		if (commandLineConfigPath) {
			getConfigFileContents(
				commandLineConfigPath,
				function (err, contents) {
					if (err) {
						return callback(err);
					}

					settings.commandLineConfig = contents;
					return callback();
				});
		} else {
			return callback();
		}
	}

	function loadCommandLineSwitches(callback) {
		var
			arg,
			args = process.argv.slice(2), // removes node command
			commandLineMapKeys = Object.keys(settings.options.readCommandLineMap),
			commandLineSettings = [],
			i = 0;

		if (commandLineMapKeys.length > 0) {
			for (; i < args.length; i++) {
				arg = args[i];

				if (arg &&
					commandLineMapKeys.indexOf(arg) !== -1 &&
					args.length >= i + 1) {
					commandLineSettings.push(
						createObjectWithValue(
							settings.options.readCommandLineMap[arg],
							args[i + 1]));
				}
			}

			cloneAndMerge(
				[settings.commandLineConfig || {}].concat(commandLineSettings),
				function (err, clonedObject) {
					settings.commandLineConfig = clonedObject;
					return callback();
				});
		} else {
			return callback();
		}
	}

	function loadEnvironmentConfig(callback) {
		var environmentConfigPath;

		if (process.env.NODE_ENV &&
			settings.options.environmentSearchPaths &&
			Array.isArray(settings.options.environmentSearchPaths)) {

			async.some(
				settings.options.environmentSearchPaths,
				function (searchPath, next) {
					var path = searchPath +
						((searchPath.charAt(searchPath.length - 1) !== '/') ? '/' : '') +
						process.env.NODE_ENV +
						'.json';

					if (fs.existsSync(path)) {
						environmentConfigPath = path;
					}

					return next(environmentConfigPath ? true : false);
				},
				function (environmentConfigFound) {
					if (environmentConfigFound) {
						getConfigFileContents(
							environmentConfigPath,
							function (err, contents) {
								if (err) {
									return callback(err);
								}

								settings.environmentConfig = contents;
								return callback();
							});
					} else {
						return callback();
					}
				});
		} else {
			return callback();
		}
	}

	function loadEnvironmentVariables(callback) {
		var
			environmentKeys,
			environmentMapKeys = Object.keys(settings.options.readEnvironmentMap),
			environmentSettings = [];

		if (environmentMapKeys.length > 0) {
			environmentKeys = Object.keys(process.env);
			environmentKeys.forEach(function (key) {
				if (environmentMapKeys.indexOf(key) !== -1) {
					environmentSettings.push(
						createObjectWithValue(
							settings.options.readEnvironmentMap[key],
							process.env[key]));
				}
			});

			cloneAndMerge(
				[settings.environmentConfig || {}].concat(environmentSettings),
				function (err, clonedObject) {
					settings.environmentConfig = clonedObject;
					return callback();
				});
		} else {
			return callback();
		}
	}

	function reset(callback) {
		delete settings.baseConfig;
		delete settings.environmentConfig;
		delete settings.commandLineConfig;

		return callback();
	}

	/**
	 * Initializes settings, refreshes all config and begins load
	 * from base file (if specified), environment and then command line
	 *
	 **/
	settings.initialize = function (options, callback) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		} else {
			options = options || {};
		}

		async.series([
				// clear out existing properties
				async.apply(reset),

				// get options all sorted out
				async.apply(getOptions(options)),

				// load base config if one exists
				async.apply(loadBaseConfig),

				// load environment configs if they exist
				async.apply(loadEnvironmentConfig),

				// load environment variables where they match config
				async.apply(loadEnvironmentVariables),

				// load command line configs if they exist
				async.apply(loadCommandLineConfig),

				// load environment variables where they match config
				async.apply(loadCommandLineSwitches),

				// combine and reduce config files
				async.apply(combineConfig)
			],
			function (err) {
				if (err) {
					return callback(err);
				}

				return callback(null, settings.config);
			});
	};

	return settings;
}({}));

