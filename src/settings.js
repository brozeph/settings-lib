import fs from 'fs';
import path from 'path';

const DEFAULT_ARGV_START_POSITION = 2;

/**
 * Primary module
 **/
module.exports = (function (settings) {
	let
		defaultOptions = {
			baseSettingsPath : '',
			commandLineSwitches : ['--config-file'],
			environmentSearchPaths : ['./', './config', './settings'],
			readCommandLineMap : {},
			readEnvironmentMap : {}
		},
		defaultTypesMap = {};


	/**
	 * Creates an internal map used to understand the original value type of
	 * a field within the base configuration file. Values of subsequent overrides
	 * are coerced accordingly based on the map created.
	 *
	 * @param {object} source - an object
	 * @param {string} parentPath - a namespaced field name used as a hash key
	 * @returns {undefined}
	 **/
	function buildDefaultTypesMap (source, parentPath) {
		Object.keys(source).forEach((key) => {
			let keyPath = parentPath ? [parentPath, key].join('.') : key;

			if (source[key] === null) {
				return;
			}

			// array coercion
			if (Array.isArray(source[key])) {
				defaultTypesMap[keyPath] = function (value) {
					if (Array.isArray(value)) {
						return value;
					}

					// remove front and back brackets, then split on commas
					return value.slice(1, -1).split(',');
				};

				return;
			}

			// date coercion
			if (Object.prototype.toString.call(source[key]) === '[object Date]') {
				defaultTypesMap[keyPath] = function (value) {
					return new Date(value);
				};

				return;
			}

			// object coercion
			if (typeof source[key] === 'object' &&
				/^\[object\sObject\]$/.test(source[key].toString()) &&
				source[key] !== null) {
				return buildDefaultTypesMap(source[key], keyPath);
			}

			defaultTypesMap[keyPath] = function (value) {
				switch (typeof source[key]) {
					case 'boolean':
						return /^true|1$/i.test(value);
					case 'number':
						return Number(value);
					default:
						return value;
				}
			};

			return;
		});
	}

	/**
	 * Returns a Promise that can be used to determine if a file exists.
	 *
	 * @param {string} filePath - a path to a file
	 * @returns {Promise} - a native Promise that resolves true or false
	 **/
	function checkIfFileExists (filePath) {
		return new Promise((resolve) => {
			return fs.exists(filePath, resolve);
		});
	}

	/**
	 * Creates a new object and merges multiple objects together,
	 * each subsequent object having priority
	 *
	 * @param {Array} objectList - accepts array of objects
	 * @returns {Object} a newly cloned object with the merged results
	 **/
	function cloneAndMerge (objectList) {
		if (!Array.isArray(objectList)) {
			return objectList;
		}

		let
			cloned = {},
			cloner = function (source, destination) {
				Object.keys(source).forEach(function (key) {
					if (Array.isArray(source[key])) {
						destination[key] = source[key];
					} else if (typeof source[key] === 'object' && source[key] !== null) {
						destination[key] = cloner(source[key], destination[key] || {});
					} else {
						destination[key] = source[key];
					}
				});

				return destination;
			};

		objectList.forEach(function (item) {
			if (typeof item === 'object') {
				cloned = cloner(item, cloned);
			}
		});

		return cloned;
	}

	/**
	 * Creates a new object based on an expression representing a single field
	 * in an object and applies specified value
	 *
	 * @param {string} expression - string Javascript expression
	 * @param {Array|Boolean|Number|Object|string} value - value to assign to the end result of the expression
	 * @returns {Object} - the object created
	 **/
	function createObjectWithValue (expression, value) {
		let
			atEnd = function (list, key) {
				return list.indexOf(key) === list.length - 1;
			},
			current,
			keys = [],
			// matches ], '], "], ][, '][', "][", [, [' and ["
			regexHash = /([\'\"]?\]\[[\'\"]?)|(\[[\'\"]?)|([\'\"]?\])/g,
			stack = {},
			transform;

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

			// define value transform function
			transform = defaultTypesMap[keys.join('.')] || function (input) {
				return input;
			};

			// create an object graph representing string based script notation
			keys.forEach(function (key) {
				if (!current) {
					current = stack;
				}

				current[key] = atEnd(keys, key) ? transform(value) : {};
				current = current[key];
			});
		}

		return stack;
	}

	/**
	 * Loads JSON configuration data from a text file
	 *
	 * @param {string} filePath - path to JSON configuration file
	 * @returns {Promise} - a native Promise that resolves the file content
	 **/
	function getConfigFileContents(filePath) {
		return new Promise((resolve, reject) => {
			let
				chunks = [],
				fileRead = fs.createReadStream(filePath, { encoding : 'utf8' }),
				json;

			fileRead.on('data', (chunk) => (chunks.push(chunk)));

			fileRead.on('end', () => {
				try {
					json = JSON.parse(chunks.join(''));
				} catch (ex) {
					return reject(
						new Error(
							`settings-lib: unable to parse JSON settings: ${ex.message}`));
				}

				return resolve(json);
			});

			fileRead.on('error', (err) => {
				return reject(
					new Error(
						`settings-lib: unable to read settings file: ${err.message}`));
			});
		});
	}

	/**
	 * Loads base configuration for settings
	 *
	 * @returns {Promise} - a native Promise
	 **/
	function loadBaseConfig () {
		return new Promise((resolve, reject) => {
			if (!settings.options.baseSettingsPath) {
				settings.baseConfig = {};

				return resolve();
			}

			return getConfigFileContents(settings.options.baseSettingsPath)
				.then((contents) => {
					buildDefaultTypesMap(contents);
					settings.baseConfig = contents;

					return resolve();
				})
				.catch(reject);
		});
	}

	/**
	 * Loads command line configuration file
	 *
	 * @returns {Promise} - a native Promise
	 **/
	function loadCommandLineConfig () {
		return new Promise((resolve, reject) => {
			let
				args = process.argv.slice(DEFAULT_ARGV_START_POSITION), // removes node command
				commandLineConfigPath;

			// no sense in doing this routine if no command line switches are configured
			if (!Array.isArray(settings.options.commandLineSwitches) ||
				settings.options.commandLineSwitches.length < 1) {

				return resolve();
			}

			// iterate args from command line
			args.some((arg, i) => {
				if (!arg) {
					return false;
				}

				if (settings.options.commandLineSwitches.indexOf(arg) >= 0 && args[i + 1]) {
					commandLineConfigPath = args[i + 1];
					return true;
				}

				return false;
			});

			// if no path was identified, exit out
			if (!commandLineConfigPath) {
				return resolve();
			}

			// if a path was identified, load it
			return getConfigFileContents(commandLineConfigPath)
				.then((contents) => {
					settings.commandLineConfig = contents;

					return resolve();
				})
				.catch(reject);
		});
	}

	/**
	 * Applies command line switch overrides
	 *
	 * @returns {Promise} - a native Promise
	 **/
	function loadCommandLineSwitches () {
		return new Promise((resolve) => {
			let
				args = process.argv.slice(DEFAULT_ARGV_START_POSITION), // removes node command
				commandLineMapKeys = Object.keys(settings.options.readCommandLineMap),
				commandLineSettings = [];

			// return if there are no configured command line mappings to look for
			if (!commandLineMapKeys.length) {
				return resolve();
			}

			// iterate each arg and associate to any configured command line overrides
			args.forEach((arg, i) => {
				if (!arg) {
					return;
				}

				if (commandLineMapKeys.indexOf(arg) >= 0 && args[i + 1]) {
					// collect command line override value
					commandLineSettings.push(
						createObjectWithValue(
							settings.options.readCommandLineMap[arg],
							args[i + 1]));
				}
			});

			settings.commandLineConfig = cloneAndMerge(
				[settings.commandLineConfig || {}].concat(commandLineSettings));

			return resolve();
		});
	}

	/**
	 * Loads environment configuration file
	 *
	 * @returns {Promise} - a native Promise
	 **/
	function loadEnvironmentConfig () {
		return new Promise((resolve, reject) => {
			let searchEnvironment =
				process.env.NODE_ENV &&
				settings.options.environmentSearchPaths &&
				Array.isArray(settings.options.environmentSearchPaths);

			if (!searchEnvironment) {
				return resolve();
			}

			return Promise.all(
				settings.options.environmentSearchPaths
					.map((searchPath) => {
						let environmentOverridePath = path.resolve([
							path.join(searchPath, process.env.NODE_ENV),
							'.json'].join(''));

						return new Promise((resolve, reject) => {
							return checkIfFileExists(environmentOverridePath)
								.then((exists) => {
									return resolve({
										exists,
										path : environmentOverridePath
									});
								})
								.catch(reject);
						});
					})
				).then((resultsList) => {
					let validPaths = resultsList.filter((result) => (result.exists));

					if (!validPaths.length) {
						return resolve();
					}

					return getConfigFileContents(validPaths[0].path)
						.then((contents) => {
							settings.environmentConfig = contents;

							return resolve();
						})
						.catch(reject);
				})
				.catch(reject);
		});
	}

	/**
	 * Loads environment variable overrides
	 *
	 * @returns {Promise} - a native Promise
	 **/
	function loadEnvironmentVariables () {
		return new Promise((resolve) => {
			let
				environmentKeys,
				environmentMapKeys = Object.keys(settings.options.readEnvironmentMap),
				environmentSettings = [];

			// return if there are no configured command line mappings to look for
			if (!environmentMapKeys.length) {
				return resolve();
			}

			environmentKeys = Object.keys(process.env);
			environmentKeys.forEach((key) => {
				if (environmentMapKeys.indexOf(key) >= 0) {
					environmentSettings.push(
						createObjectWithValue(
							settings.options.readEnvironmentMap[key],
							process.env[key]));
				}
			});

			settings.environmentConfig = cloneAndMerge(
				[settings.environmentConfig || {}].concat(environmentSettings));

			return resolve();
		});
	}

	/**
	 * Initializes settings, refreshes all config and begins load
	 * from base file (if specified), environment and then command line
	 *
	 * @param {Object} options - an optional set of instructions for initialization
	 * @param {function} callback - an optional callback function
	 * @returns {undefined|Promise} - if callback is not supplied, a native Promise is returned
	 **/
	settings.initialize = async (options, callback) => {
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		// ensure options are empty if null or not set
		options = options || {};

		// handle backwards compatability for previous versions of library
		if (options.baseConfigPath) {
			options.baseSettingsPath = options.baseConfigPath;
			delete options.baseConfigPath;
		}

		let exec = async () => {
			// clean up and prepare internal references
			delete settings.baseConfig;
			delete settings.environmentConfig;
			delete settings.commandLineConfig;

			// get input options sorted...
			settings.options = cloneAndMerge([defaultOptions, options]);

			// start loading up and applying all layers of configuration
			await loadBaseConfig();
			await loadEnvironmentConfig();
			await loadEnvironmentVariables();
			await loadCommandLineConfig();
			await loadCommandLineSwitches();

			// prepare the settings
			settings.config = cloneAndMerge([
				settings.baseConfig || {},
				settings.environmentConfig || {},
				settings.commandLineConfig || {}
			]);

			return settings.config;
		}

		// return the async function / Promise
		if (!callback) {
			return await exec();
		}

		// execute and return via the callback
		return exec()
			.then((result) => callback(null, result))
			.catch((ex) => callback(ex));
	};

	return settings;
}({}));
