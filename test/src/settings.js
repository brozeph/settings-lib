import chai from 'chai';
import settingsLib from '../../src/settings.js';

const
	DEFAULT_ARGV_START_POSITION = 2,
	should = chai.should();


describe('settings', () => {

	let defaultOptions;

	beforeEach(() => {
		defaultOptions = {
			baseSettingsPath : 'test/baseConfig.json'
		};
	});

	describe('#initialize', () => {
		it('should allow initialization with null options', (done) => {
			settingsLib.initialize(null, (err, settings) => {
				should.not.exist(err);
				should.exist(settings);

				return done();
			});
		});

		it('should allow initialization with undefined options', (done) => {
			settingsLib.initialize((err, settings) => {
				should.not.exist(err);
				should.exist(settings);

				return done();
			});
		});
	});

	describe('options.baseSettingsPath', () => {
		it('should load a base config', (done) => {
			settingsLib.initialize(defaultOptions, (err, settings) => {
				should.not.exist(err);
				should.exist(settings);
				should.exist(settings['test-key']);

				return done();
			});
		});

		it('should throw exception if a base config path is supplied but not found', (done) => {
			defaultOptions.baseSettingsPath = 'config.not.there.json';
			settingsLib.initialize(defaultOptions, (err, settings) => {
				should.exist(err);
				should.not.exist(settings);

				return done();
			});
		});

		it('should load base config (Promise)', (done) => {
			settingsLib
				.initialize(defaultOptions)
				.then((settings) => {
					should.exist(settings);
					should.exist(settings['test-key']);

					return done();
				})
				.catch(done);
		});

		it('should load a YAML base config', (done) => {
			defaultOptions.baseSettingsPath = 'test/baseConfig.yml';

			settingsLib.initialize(defaultOptions, (err, settings) => {
				should.not.exist(err);
				should.exist(settings);
				should.exist(settings['test-key']);

				return done();
			});
		});
	});

	describe('options.environmentSearchPaths', () => {
		it('should not load environment config if environment config file not found', (done) => {
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.environmentConfig);

					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should load environment config if present', (done) => {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);

					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should choke loading badly formatted environment config file', (done) => {
			process.env.NODE_ENV = 'bad';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.exist(err);
					should.not.exist(settings);

					// clean up
					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should override base config with environment config', (done) => {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);
					settings['test-key'].should.equal('test-value-override');

					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should not set environment config on library when no environment is specified', (done) => {
			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.environmentConfig);
					settings['test-key'].should.equal('test-value');

					return done();
				});
		});

		it('should use last match if multiple environment override files are found based on environment', (done) => {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test', './test/multiple-env-path-test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settings['test-key']);
					settings['test-key'].should.equal('test-value-override');

					// clean up
					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should load a YAML override file if found based on environment', (done) => {
			process.env.NODE_ENV = 'another-test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);
					settings['test-key'].should.equal('test-value-override');
					settings.sub['sub-test-key'].should.equal('sub-test-value-override');

					delete process.env.NODE_ENV;

					return done();
				});
		});
	});

	describe('options.commandLineSwitches', () => {
		it('should load command line config if present', (done) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.commandLineConfig);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should choke loading command line config if file not found', (done) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.not.there.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.exist(err);
					should.not.exist(settings);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should override base config with command line config', (done) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.commandLineConfig);
					settings['test-key'].should.equal('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should override both base and environment config with command line config', (done) => {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.commandLineConfig);
					should.exist(settingsLib.environmentConfig);
					settings['test-key'].should.equal('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);
					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should choke loading badly formatted command line config file', (done) => {
			process.argv.push('--config-file');
			process.argv.push('./test/bad.json');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.exist(err);
					should.not.exist(settings);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should do nothing if commandLineSwitches is not an array', (done) => {
			process.argv.push('--config-file');
			process.argv.push('./test/badly.formed.json');

			defaultOptions.commandLineSwitches = 'not an array';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.commandLineConfig);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});
	});

	describe('options.readEnvironmentMap', () => {
		it('should allow mapping to be specified at initialization', (done) => {
			defaultOptions.readEnvironmentMap = {
				test : 'test'
			};

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.options.readEnvironmentMap);
					should.exist(settingsLib.options.readEnvironmentMap.test);
					settingsLib.options.readEnvironmentMap.test.should.equal(
						defaultOptions.readEnvironmentMap.test);

					return done();
				});
		});

		it('when specified, should read environment variables matching config', (done) => {
			defaultOptions.readEnvironmentMap = {
				'APP_SUB_SUB_TEST_KEY' : 'sub["sub-test"]["sub-test-key"]',
				'APP_SUB_TEST_KEY' : 'sub.sub-test-key'
			};

			process.env.APP_SUB_TEST_KEY = 'overridden by environment variable';
			process.env.APP_SUB_SUB_TEST_KEY = 'overridden again by environment variable';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					settings['test-key'].should.equal('test-value');
					should.exist(settings.sub);
					should.exist(settings.sub['sub-test-key']);
					settings.sub['sub-test-key'].should.equal('overridden by environment variable');
					should.exist(settings.sub['sub-test']['sub-test-key']);

					delete process.env.APP_SUB_TEST_KEY;
					delete process.env.APP_SUB_SUB_TEST_KEY;

					return done();
				});
		});

		it('should coerce to type found in base config', (done) => {
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
					should.not.exist(err);
					should.exist(settings);

					should.exist(settings.sub);
					should.exist(settings.sub['sub-sub']);
					should.exist(settings.sub['sub-sub']['sub-sub-test-array']);
					settings.sub['sub-sub']['sub-sub-test-array'].should.be.a('array');

					should.exist(settings.sub['sub-sub']['sub-sub-test-bool']);
					settings.sub['sub-sub']['sub-sub-test-bool'].should.be.a('boolean');

					should.exist(settings.sub['sub-sub']['sub-sub-test-number']);
					settings.sub['sub-sub']['sub-sub-test-number'].should.be.a('number');

					delete process.env.COERCE_ARRAY;
					delete process.env.COERCE_BOOL;
					delete process.env.COERCE_NUMBER;

					return done();
				});
		});

		it('should apply environment variables over environment config', (done) => {
			defaultOptions.readEnvironmentMap = {
				'APP_SUB_EXTRA_KEY' : 'extra-key.sub-extra-key'
			};
			defaultOptions.environmentSearchPaths = ['./test'];

			process.env.NODE_ENV = 'test';
			process.env.APP_SUB_EXTRA_KEY = 'overridden by environment variable';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					settings['test-key'].should.equal('test-value-override');
					should.exist(settings['extra-key']);
					should.exist(settings['extra-key']['sub-extra-key']);
					settings['extra-key']['sub-extra-key']
						.should.equal('overridden by environment variable');

					delete process.env.NODE_ENV;
					delete process.env.APP_SUB_EXTRA_KEY;

					return done();
				});
		});

		it('should create config for environment mappings when base config key does not exist', (done) => {
			defaultOptions.readEnvironmentMap = {
				'APP_NO_KEY' : 'no-key.sub-no-key'
			};

			process.env.APP_NO_KEY = 'created from environment variable';

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings['no-key']);
					should.exist(settings['no-key']['sub-no-key']);
					settings['no-key']['sub-no-key']
						.should.equal('created from environment variable');

					delete process.env.APP_NO_KEY;

					return done();
				});
		});
	});

	describe('options.readCommandLineMap', () => {
		it('should allow mapping to be specified at initialization', (done) => {
			defaultOptions.readCommandLineMap = {
				test : 'test'
			};

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.options.readCommandLineMap);
					should.exist(settingsLib.options.readCommandLineMap.test);
					settingsLib.options.readCommandLineMap.test
						.should.equal(defaultOptions.readCommandLineMap.test);

					return done();
				});
		});

		it('when specified, should read command line switches matching config', (done) => {
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
					should.not.exist(err);
					should.exist(settings);
					settings['test-key'].should.equal('test-value');
					should.exist(settings.sub);
					should.exist(settings.sub['sub-test-key']);
					settings.sub['sub-test-key'].should.equal('overridden by command line switch');
					should.exist(settings.sub['sub-test']['sub-test-key']);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - paramCount);

					return done();
				});
		});

		it('should apply command line switches over command line config', (done) => {
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
					should.not.exist(err);
					should.exist(settings);
					settings['test-key'].should.equal('test-value-override');
					should.exist(settings['extra-key']);
					should.exist(settings['extra-key']['sub-extra-key']);
					settings['extra-key']['sub-extra-key']
						.should.equal('overridden by command line switch');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - paramCount);

					return done();
				});
		});

		it('should create config for command line switches when base config key does not exist', (done) => {
			defaultOptions.readCommandLineMap = {
				'--no-key' : 'no-key.sub-no-key'
			};

			process.argv.push('--no-key');
			process.argv.push('created from command line switch');

			settingsLib.initialize(
				defaultOptions,
				(err, settings) => {
					should.not.exist(err);
					should.exist(settings['no-key']);
					should.exist(settings['no-key']['sub-no-key']);
					settings['no-key']['sub-no-key']
						.should.equal('created from command line switch');

					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});
	});

	describe('options.strict', () => {
		it('should apply only when baseSettingsPath is provided', (done) => {
			defaultOptions.environmentSearchPaths = ['./test'];
			defaultOptions.strict = false;
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(defaultOptions, (err, settings) => {
				should.not.exist(err);
				should.exist(settings);
				should.exist(settings['test-key']);
				should.exist(settings.sub['sub-test-key']);
				settings.sub['sub-test-key'].should.equal('sub-test-value-override');
				should.exist(settings['extra-key']);
				should.exist(settings['extra-key']['sub-extra-key']);

				return done();
			});
		});

		it('should ignore additional keys defined in environment override files', (done) => {
			defaultOptions.environmentSearchPaths = ['./test'];
			defaultOptions.strict = true;
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(defaultOptions, (err, settings) => {
				should.not.exist(err);
				should.exist(settings);
				should.exist(settings['test-key']);
				should.exist(settings.sub['sub-test-key']);
				settings.sub['sub-test-key'].should.equal('sub-test-value-override');
				should.not.exist(settings['extra-key']);

				return done();
			});
		});
	});
});

export default {};
