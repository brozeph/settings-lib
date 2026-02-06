import { expect } from 'vitest';
import settingsLib from '../../src/settings.js';

const DEFAULT_ARGV_START_POSITION = 2;


describe('settings', () => {

	let defaultOptions;

	beforeEach(() => {
		defaultOptions = {
			baseSettingsPath : 'test/baseConfig.json'
		};
	});

	describe('#initialize', () => {
		it('should allow initialization with null options', async () => {
			await new Promise((resolve) => {
				settingsLib.initialize(null, (err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					resolve();
				});
			});
		});

		it('should allow initialization with undefined options', async () => {
			await new Promise((resolve) => {
				settingsLib.initialize((err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					resolve();
				});
			});
		});
	});

	describe('options.baseSettingsPath', () => {
		it('should load a base config', async () => {
			await new Promise((resolve) => {
				settingsLib.initialize(defaultOptions, (err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settings['test-key']).toBeDefined();
					resolve();
				});
			});
		});

		it('should throw exception if a base config path is supplied but not found', async () => {
			defaultOptions.baseSettingsPath = 'config.not.there.json';
			await new Promise((resolve) => {
				settingsLib.initialize(defaultOptions, (err, settings) => {
					expect(err).toBeTruthy();
					expect(settings).toBeFalsy();
					resolve();
				});
			});
		});

		it('should load base config (Promise)', async () => {
			const settings = await settingsLib.initialize(defaultOptions);
			expect(settings).toBeDefined();
			expect(settings['test-key']).toBeDefined();
		});

		it('should load a YAML base config', async () => {
			defaultOptions.baseSettingsPath = 'test/baseConfig.yml';

			await new Promise((resolve) => {
				settingsLib.initialize(defaultOptions, (err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settings['test-key']).toBeDefined();
					resolve();
				});
			});
		});
	});

	describe('options.environmentSearchPaths', () => {
		it('should not load environment config if environment config file not found', async () => {
 await new Promise((resolve) => {
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.environmentConfig).toBeFalsy();

					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});

		it('should load environment config if present', async () => {
 await new Promise((resolve) => {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.environmentConfig).toBeDefined();

					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});

		it('should choke loading badly formatted environment config file', async () => {
 await new Promise((resolve) => {
			process.env.NODE_ENV = 'bad';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeTruthy();
					expect(settings).toBeFalsy();

					// clean up
					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});

		it('should override base config with environment config', async () => {
 await new Promise((resolve) => {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.environmentConfig).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override');

					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});

		it('should not set environment config on library when no environment is specified', async () => {
 await new Promise((resolve) => {
			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.environmentConfig).toBeFalsy();
					expect(settings['test-key']).toBe('test-value');

					resolve();
				});
			});
		});

		it('should use last match if multiple environment override files are found based on environment', async () => {
 await new Promise((resolve) => {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test', './test/multiple-env-path-test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
				expect(settings['test-key']).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override');

					// clean up
					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});

		it('should load a YAML override file if found based on environment', async () => {
 await new Promise((resolve) => {
			process.env.NODE_ENV = 'another-test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.environmentConfig).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override');
					expect(settings.sub['sub-test-key']).toBe('sub-test-value-override');

					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});
	});

	describe('options.commandLineSwitches', () => {
		it('should load command line config if present', async () => {
 await new Promise((resolve) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.commandLineConfig).toBeDefined();

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					resolve();
				});
			});
		});

		it('should choke loading command line config if file not found', async () => {
 await new Promise((resolve) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.not.there.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeTruthy();
					expect(settings).toBeFalsy();

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					resolve();
				});
			});
		});

		it('should override base config with command line config', async () => {
 await new Promise((resolve) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.commandLineConfig).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					resolve();
				});
			});
		});

		it('should override both base and environment config with command line config', async () => {
 await new Promise((resolve) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.commandLineConfig).toBeDefined();
					expect(settingsLib.environmentConfig).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);
					delete process.env.NODE_ENV;

					resolve();
				});
			});
		});

		it('should choke loading badly formatted command line config file', async () => {
 await new Promise((resolve) => {
			process.argv.push('--config-file');
			process.argv.push('./test/bad.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeTruthy();
					expect(settings).toBeFalsy();

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					resolve();
				});
			});
		});

		it('should do nothing if commandLineSwitches is not an array', async () => {
 await new Promise((resolve) => {
			process.argv.push('--config-file');
			process.argv.push('./test/badly.formed.json');

			defaultOptions.commandLineSwitches = 'not an array';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.commandLineConfig).toBeFalsy();

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					resolve();
				});
			});
		});
	});

	describe('options.readEnvironmentMap', () => {
		it('should allow mapping to be specified at initialization', async () => {
 await new Promise((resolve) => {
			defaultOptions.readEnvironmentMap = {
				test : 'test'
			};

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.options.readEnvironmentMap).toBeDefined();
					expect(settingsLib.options.readEnvironmentMap.test).toBeDefined();
					expect(settingsLib.options.readEnvironmentMap.test).toBe(
						defaultOptions.readEnvironmentMap.test);

					resolve();
				});
			});
		});

		it('when specified, should read environment variables matching config', async () => {
 await new Promise((resolve) => {
			defaultOptions.readEnvironmentMap = {
				'APP_SUB_SUB_TEST_KEY' : 'sub["sub-test"]["sub-test-key"]',
				'APP_SUB_TEST_KEY' : 'sub.sub-test-key'
			};

			process.env.APP_SUB_TEST_KEY = 'overridden by environment variable';
			process.env.APP_SUB_SUB_TEST_KEY = 'overridden again by environment variable';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settings['test-key']).toBe('test-value');
					expect(settings.sub).toBeDefined();
					expect(settings.sub['sub-test-key']).toBeDefined();
					expect(settings.sub['sub-test-key']).toBe('overridden by environment variable');
					expect(settings.sub['sub-test']['sub-test-key']).toBeDefined();

					delete process.env.APP_SUB_TEST_KEY;
					delete process.env.APP_SUB_SUB_TEST_KEY;

					resolve();
				});
			});
		});

		it('should coerce to type found in base config', async () => {
 await new Promise((resolve) => {
			defaultOptions.readEnvironmentMap = {
				'COERCE_ARRAY' : 'sub.sub-sub.sub-sub-test-array',
				'COERCE_BOOL' : 'sub.sub-sub.sub-sub-test-bool',
				'COERCE_NUMBER' : 'sub["sub-sub"]["sub-sub-test-number"]'
			};

			process.env.COERCE_ARRAY = '[1,,3]';
			process.env.COERCE_BOOL = 'false';
			process.env.COERCE_NUMBER = '1337';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();

					expect(settings.sub).toBeDefined();
					expect(settings.sub['sub-sub']).toBeDefined();
					expect(settings.sub['sub-sub']['sub-sub-test-array']).toBeDefined();
					expect(Array.isArray(settings.sub['sub-sub']['sub-sub-test-array'])).toBe(true);

					expect(settings.sub['sub-sub']['sub-sub-test-bool']).toBeDefined();
					expect(typeof settings.sub['sub-sub']['sub-sub-test-bool']).toBe('boolean');

					expect(settings.sub['sub-sub']['sub-sub-test-number']).toBeDefined();
					expect(typeof settings.sub['sub-sub']['sub-sub-test-number']).toBe('number');

					delete process.env.COERCE_ARRAY;
					delete process.env.COERCE_BOOL;
					delete process.env.COERCE_NUMBER;

					resolve();
				});
			});
		});

		it('should apply environment variables over environment config', async () => {
 await new Promise((resolve) => {
			defaultOptions.readEnvironmentMap = {
				'APP_SUB_EXTRA_KEY' : 'extra-key.sub-extra-key'
			};
			defaultOptions.environmentSearchPaths = ['./test'];

			process.env.NODE_ENV = 'test';
			process.env.APP_SUB_EXTRA_KEY = 'overridden by environment variable';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override');
					expect(settings['extra-key']).toBeDefined();
					expect(settings['extra-key']['sub-extra-key']).toBeDefined();
					expect(settings['extra-key']['sub-extra-key'])
						.toBe('overridden by environment variable');

					delete process.env.NODE_ENV;
					delete process.env.APP_SUB_EXTRA_KEY;

					resolve();
				});
			});
		});

		it('should create config for environment mappings when base config key does not exist', async () => {
 await new Promise((resolve) => {
			defaultOptions.readEnvironmentMap = {
				'APP_NO_KEY' : 'no-key.sub-no-key'
			};

			process.env.APP_NO_KEY = 'created from environment variable';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings['no-key']).toBeDefined();
					expect(settings['no-key']['sub-no-key']).toBeDefined();
					expect(settings['no-key']['sub-no-key'])
						.toBe('created from environment variable');

					delete process.env.APP_NO_KEY;

					resolve();
				});
			});
		});
	});

	describe('options.readCommandLineMap', () => {
		it('should allow mapping to be specified at initialization', async () => {
 await new Promise((resolve) => {
			defaultOptions.readCommandLineMap = {
				test : 'test'
			};

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settingsLib.options.readCommandLineMap).toBeDefined();
					expect(settingsLib.options.readCommandLineMap.test).toBeDefined();
					expect(settingsLib.options.readCommandLineMap.test)
						.toBe(defaultOptions.readCommandLineMap.test);

					resolve();
				});
			});
		});

		it('when specified, should read command line switches matching config', async () => {
 await new Promise((resolve) => {
			var paramCount = 4;

			defaultOptions.readCommandLineMap = {
				'--sub-sub-test-key' : 'sub["sub-test"]["sub-test-key"]',
				'--sub-test-key' : 'sub.sub-test-key'
			};

			process.argv.push('--sub-test-key');
			process.argv.push('overridden by command line switch');
			process.argv.push('--sub-sub-test-key');
			process.argv.push('overridden again by environment variable');
			process.env.APP_SUB_SUB_TEST_KEY = 'overridden again by command line switch';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settings['test-key']).toBe('test-value');
					expect(settings.sub).toBeDefined();
					expect(settings.sub['sub-test-key']).toBeDefined();
					expect(settings.sub['sub-test-key']).toBe('overridden by command line switch');
					expect(settings.sub['sub-test']['sub-test-key']).toBeDefined();

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - paramCount);

					resolve();
				});
			});
		});

		it('should apply command line switches over command line config', async () => {
 await new Promise((resolve) => {
			var paramCount = 4;

			defaultOptions.readCommandLineMap = {
				'--sub-extra-key' : 'extra-key.sub-extra-key'
			};

			process.argv.push('--config-file');
			process.argv.push('./test/test.json');
			process.argv.push('--sub-extra-key');
			process.argv.push('overridden by command line switch');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings).toBeDefined();
					expect(settings['test-key']).toBe('test-value-override');
					expect(settings['extra-key']).toBeDefined();
					expect(settings['extra-key']['sub-extra-key']).toBeDefined();
					expect(settings['extra-key']['sub-extra-key'])
						.toBe('overridden by command line switch');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - paramCount);

					resolve();
				});
			});
		});

		it('should create config for command line switches when base config key does not exist', async () => {
 await new Promise((resolve) => {
			defaultOptions.readCommandLineMap = {
				'--no-key' : 'no-key.sub-no-key'
			};

			process.argv.push('--no-key');
			process.argv.push('created from command line switch');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					expect(err).toBeFalsy();
					expect(settings['no-key']).toBeDefined();
					expect(settings['no-key']['sub-no-key']).toBeDefined();
					expect(settings['no-key']['sub-no-key'])
						.toBe('created from command line switch');

					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					resolve();
				});
			});
		});
	});

	describe('options.strict', () => {
		it('should apply only when baseSettingsPath is provided', async () => {
 await new Promise((resolve) => {
			defaultOptions.environmentSearchPaths = ['./test'];
			defaultOptions.strict = false;
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(defaultOptions, (err, settings) => {
				expect(err).toBeFalsy();
				expect(settings).toBeDefined();
				expect(settings['test-key']).toBeDefined();
				expect(settings.sub['sub-test-key']).toBeDefined();
				expect(settings.sub['sub-test-key']).toBe('sub-test-value-override');
				expect(settings['extra-key']).toBeDefined();
				expect(settings['extra-key']['sub-extra-key']).toBeDefined();

				resolve();
			});
			});
		});

		it('should ignore additional keys defined in environment override files', async () => {
 await new Promise((resolve) => {
			defaultOptions.environmentSearchPaths = ['./test'];
			defaultOptions.strict = true;
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(defaultOptions, (err, settings) => {
				expect(err).toBeFalsy();
				expect(settings).toBeDefined();
				expect(settings['test-key']).toBeDefined();
				expect(settings.sub['sub-test-key']).toBeDefined();
				expect(settings.sub['sub-test-key']).toBe('sub-test-value-override');
				expect(settings['extra-key']).toBeFalsy();

				resolve();
			});
			});
		});
	});
});
