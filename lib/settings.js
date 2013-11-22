var
	fs = require('fs'),

	async = require('async'),

	defaultOptions = {
		baseConfigPath : '',
		environmentSearchPaths : ['./', './config', './settings'],
		commandLineSwitches : ['--config-file']
	};


/* *
 * creates a new object and merges multiple objects together, each subsequent object having priority
 * parameter: objects accepts array of objects
 * parameter: fields accepts array of strings and can be null/undefined
 * if fields are supplied, fields copied/overwritten from values in subsequent objects must appear in array
 * */
function cloneAndMerge(objects, fields, callback) {
	'use strict';

	if (!Array.isArray(objects)) {
		return callback(null, objects);
	}

	fields = Array.isArray(fields) ? fields : [];

	var
		clone = {},
		keys = fields;

	objects.forEach(function (item) {
		if (typeof item === 'object') {
			if (!fields.length) {
				keys = Object.keys(item);
			}

			keys.forEach(function (key) {
				if (item.hasOwnProperty(key)) {
					clone[key] = item[key];
				}
			});
		}
	});

	return callback(null, clone);
}


/* *
 * loads JSON configuration data from a text file
 * parameter: path
 * parameter: callback(err, configContent)
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
 * Retrieve any command line based configuration file path
 *
 *
 * */
function getPathFromCommandLine(commandLineSwitches) {
	'use strict';

	console.log(process.argv);

	return '';
}


/* *
 * Primary class
 *
 *
 * */
module.exports = (function (settings) {
	'use strict';

	settings = settings || {};

	function combineConfig(callback) {
		var fields = [];

		if (Object.keys(settings.baseConfig).length) {
			fields = Object.keys(settings.baseConfig);
		}

		cloneAndMerge([
				settings.baseConfig || {},
				settings.environmentConfig || {}
			],
			fields,
			function (err, result) {
				settings.config = result;
				return callback(err);
			});
	}

	function getOptions(options) {
		return function (callback) {
			cloneAndMerge(
				[defaultOptions, options],
				Object.keys(defaultOptions),
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
		var path = getPathFromCommandLine(settings.options.commandLineSwitches);
		return callback();
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

	settings.initialize = function (options, callback) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		} else {
			options = options || {};
		}

		async.series([
				// get options all sorted out
				async.apply(getOptions(options)),

				// load base config if one exists
				async.apply(loadBaseConfig),

				// load environment configs if they exist
				async.apply(loadEnvironmentConfig),

				// load command line configs if they exist
				async.apply(loadCommandLineConfig),

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

