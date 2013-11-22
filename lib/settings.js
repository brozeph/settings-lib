var
	fs = require('fs'),

	ArgumentParser = require('argparse').ArgumentParser,
	async = require('async'),

	defaultOptions = {
		baseConfigPath : '',
		environmentSearchPaths : ['./', './config', './settings'],
		commandLineArguments : ['--config-file']
	};


/* *
 * creates a new object and merges multiple objects together, each subsequent object having priority
 * parameter: objects accepts array of objects
 * parameter: fields accepts array of strings and can be null/undefined
 * if fields are supplied, fields copied/overwritten from values in subsequent objects must appear in array
 * */
function cloneAndMerge (objects, fields, callback) {
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
function getConfigFileContents (path, callback) {
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
function getPathFromCommandLine (commandLinePaths, callback) {
	'use strict';

	var
		args = {},
		parser = new ArgumentParser({
			addHelp : false
		});

	parser.addArgument(commandLinePaths, {
		required : false
	});

	args = parser.parseArgs();
	console.log(args);

	return callback();
}


/* *
 * Primary class
 *
 *
 * */
module.exports = (function (settings) {
	'use strict';

	settings = settings || {};

	settings.initialize = function (options, callback) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		} else {
			options = options || {};
		}

		async.series([
				// get options all sorted out
				async.apply(function (next) {
					cloneAndMerge(
						[defaultOptions, options],
						Object.keys(defaultOptions),
						function (err, options) {
							if (err) {
								return next(err);
							}

							// real work begins here
							settings.options = options;
							return next();
						});
				}),

				// load base config if one exists
				async.apply(function (next) {
					if (settings.options.baseConfigPath) {
						getConfigFileContents(
							settings.options.baseConfigPath,
							function (err, contents) {
								if (err) {
									return next(err);
								}

								settings.baseConfig = contents;
								return next();
							});
					} else {
						settings.baseConfig = {};
						return next();
					}
				}),

				// load branch configs if they exist
				async.apply(function (next) {
					var environmentConfigPath;

					if (process.env.NODE_ENV &&
						settings.options.environmentSearchPaths &&
						Array.isArray(settings.options.environmentSearchPaths)) {

						async.some(
							settings.options.environmentSearchPaths,
							function (searchPath, done) {
								var path = searchPath +
									((searchPath.charAt(searchPath.length - 1) !== '/') ? '/' : '') +
									process.env.NODE_ENV +
									'.json';

								if (fs.existsSync(path)) {
									environmentConfigPath = path;
								}

								return done(environmentConfigPath ? true : false);
							},
							function (environmentConfigFound) {
								if (environmentConfigFound) {
									getConfigFileContents(
										environmentConfigPath,
										function (err, contents) {
											if (err) {
												return next(err);
											}

											settings.environmentConfig = contents;
											return next();
										});
								} else {
									return next();
								}
							});
					} else {
						return next();
					}
				}),

				// load command line configs if they exist

				// combine and reduce config files
				async.apply(function (next) {
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
							return next(err);
						});
				})
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

