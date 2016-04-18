var
	chai = require('chai'),

	settingsLib = require('../../lib/settings.js'),

	defaultOptions,
	should = chai.should();

const DEFAULT_ARGV_START_POSITION = 2;


describe('settings', function () {

	beforeEach(function () {
		defaultOptions = {
			baseConfigPath : 'test/baseConfig.json'
		};
	});

	describe('#initialize', function () {
		it('should allow initialization with null options', function (done) {
			settingsLib.initialize(null, function (err, settings) {
				should.not.exist(err);
				should.exist(settings);

				return done();
			});
		});

		it('should allow initialization with undefined options', function (done) {
			settingsLib.initialize(function (err, settings) {
				should.not.exist(err);
				should.exist(settings);

				return done();
			});
		});
	});

	describe('options.baseConfigPath', function() {
		it('should load a base config', function (done) {
			settingsLib.initialize(defaultOptions, function (err, settings) {
				should.not.exist(err);
				should.exist(settings);
				should.exist(settings['test-key']);

				return done();
			});
		});

		it('should throw exception if a base config path is supplied but not found', function (done) {
			defaultOptions.baseConfigPath = 'config.not.there.json';
			settingsLib.initialize(defaultOptions, function (err, settings) {
				should.exist(err);
				should.not.exist(settings);

				return done();
			});
		});

		it('should load base config (Promise)', function (done) {
			settingsLib.initialize(defaultOptions)
				.then((settings) => {
					should.exist(settings);
					should.exist(settings['test-key']);

					return done();
				})
				.catch(done);
		});
	});

	describe('options.environmentSearchPaths', function () {
		it('should not load environment config if environment config file not found', function (done) {
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.environmentConfig);

					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should load environment config if present', function (done) {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);

					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should choke loading badly formatted environment config file', function (done) {
			process.env.NODE_ENV = 'bad';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.exist(err);
					should.not.exist(settings);

					// clean up
					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should override base config with environment config', function (done) {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);
					settings['test-key'].should.equal('test-value-override');

					delete process.env.NODE_ENV;

					return done();
				});
		});

		it('should not set environment config on library when no environment is specified', function (done) {
			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.environmentConfig);
					settings['test-key'].should.equal('test-value');

					return done();
				});
		});

		it('should use last match if multiple environment override files are found based on environment', function (done) {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test', './test/multiple-env-path-test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settings['test-key']);
					settings['test-key'].should.equal('test-value-override');

					// clean up
					delete process.env.NODE_ENV;

					return done();
				});
		});
	});

	describe('options.commandLineSwitches', function () {
		it('should load command line config if present', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.commandLineConfig);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should choke loading command line config if file not found', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.not.there.json');

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.exist(err);
					should.not.exist(settings);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should override base config with command line config', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.commandLineConfig);
					settings['test-key'].should.equal('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should override both base and environment config with command line config', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
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

		it('should choke loading badly formatted command line config file', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/bad.json');

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.exist(err);
					should.not.exist(settings);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});

		it('should do nothing if commandLineSwitches is not an array', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/badly.formed.json');

			defaultOptions.commandLineSwitches = 'not an array';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.commandLineConfig);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - DEFAULT_ARGV_START_POSITION);

					return done();
				});
		});
	});

	describe('options.readEnvironmentMap', function () {
		it('should allow mapping to be specified at initialization', function (done) {
			defaultOptions.readEnvironmentMap = {
				test : 'test'
			};

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.options.readEnvironmentMap);
					should.exist(settingsLib.options.readEnvironmentMap.test);
					settingsLib.options.readEnvironmentMap.test.should.equal(
						defaultOptions.readEnvironmentMap.test);

					return done();
				});
		});

		it('when specified, should read environment variables matching config', function (done) {
			defaultOptions.readEnvironmentMap = {
				'APP_SUB_TEST_KEY' : 'sub.sub-test-key',
				'APP_SUB_SUB_TEST_KEY' : 'sub["sub-test"]["sub-test-key"]'
			};

			process.env.APP_SUB_TEST_KEY = 'overridden by environment variable';
			process.env.APP_SUB_SUB_TEST_KEY = 'overridden again by environment variable';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
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

		it('should coerce to type found in base config', function (done) {
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
				function (err, settings) {
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

		it('should apply environment variables over environment config', function (done) {
			defaultOptions.readEnvironmentMap = {
				'APP_SUB_EXTRA_KEY' : 'extra-key.sub-extra-key'
			};
			defaultOptions.environmentSearchPaths = ['./test'];

			process.env.NODE_ENV = 'test';
			process.env.APP_SUB_EXTRA_KEY = 'overridden by environment variable';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
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

		it('should create config for environment mappings when base config key does not exist', function (done) {
			defaultOptions.readEnvironmentMap = {
				'APP_NO_KEY' : 'no-key.sub-no-key'
			};

			process.env.APP_NO_KEY = 'created from environment variable';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
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

	describe('options.readCommandLineMap', function () {
		it('should allow mapping to be specified at initialization', function (done) {
			defaultOptions.readCommandLineMap = {
				test : 'test'
			};

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.options.readCommandLineMap);
					should.exist(settingsLib.options.readCommandLineMap.test);
					settingsLib.options.readCommandLineMap.test
						.should.equal(defaultOptions.readCommandLineMap.test);

					return done();
				});
		});

		it('when specified, should read command line switches matching config', function (done) {
			var paramCount = 4;

			defaultOptions.readCommandLineMap = {
				'--sub-test-key' : 'sub.sub-test-key',
				'--sub-sub-test-key' : 'sub["sub-test"]["sub-test-key"]'
			};

			process.argv.push('--sub-test-key');
			process.argv.push('overridden by command line switch');
			process.argv.push('--sub-sub-test-key');
			process.argv.push('overridden again by environment variable');
			process.env.APP_SUB_SUB_TEST_KEY = 'overridden again by command line switch';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
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

		it('should apply command line switches over command line config', function (done) {
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
				function (err, settings) {
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

		it('should create config for command line switches when base config key does not exist', function (done) {
			defaultOptions.readCommandLineMap = {
				'--no-key' : 'no-key.sub-no-key'
			};

			process.argv.push('--no-key');
			process.argv.push('created from command line switch');

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
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
});
