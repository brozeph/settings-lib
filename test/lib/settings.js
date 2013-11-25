describe('settings', function () {

	var
		defaultOptions,
		settingsLib = requireWithCoverage('settings');

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

				done();
			});
		});

		it('should allow initialization with undefined options', function (done) {
			settingsLib.initialize(function (err, settings) {
				should.not.exist(err);
				should.exist(settings);

				done();
			});
		});

		it('should load a base config', function (done) {
			settingsLib.initialize(defaultOptions, function (err, settings) {
				should.not.exist(err);
				should.exist(settings);
				should.exist(settings['test-key']);

				done();
			});
		});

		it('should throw exception if a base config path is supplied but not found', function (done) {
			defaultOptions.baseConfigPath = 'config.not.there.json';
			settingsLib.initialize(defaultOptions, function (err, settings) {
				should.exist(err);
				should.not.exist(settings);

				done();
			});
		});

		it('should not load environment config if environment config file not found', function (done) {
			process.env.NODE_ENV = 'test';

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.environmentConfig);

					delete process.env.NODE_ENV;

					done();
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

					done();
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

					done();
				});
		});

		it('should not allow extra fields to propegate from environment config if baseConfig is set', function (done) {
			process.env.NODE_ENV = 'test';
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);
					should.not.exist(settings["extra-key"]);

					delete process.env.NODE_ENV;

					done();
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
					settings["test-key"].should.equal('test-value-override');

					delete process.env.NODE_ENV;

					done();
				});
		});

		it('should propegate all fields from environment config if baseConfig is not set', function (done) {
			process.env.NODE_ENV = 'test';
			delete defaultOptions.baseConfigPath;
			defaultOptions.environmentSearchPaths = ['./test'];

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.environmentConfig);
					should.exist(settings["extra-key"]);

					delete process.env.NODE_ENV;

					done();
				});
		});

		it('should not set environment config on library when no environment is specified', function (done) {
			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.not.exist(settingsLib.environmentConfig);
					settings["test-key"].should.equal('test-value');

					done();
				});
		});

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
					process.argv = process.argv.slice(0, process.argv.length - 2);

					done();
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
					process.argv = process.argv.slice(0, process.argv.length - 2);

					done();
				});
		});

		it('should not allow extra fields to propegate from command line config if baseConfig is set', function (done) {
			process.argv.push('--config-file');
			process.argv.push('./test/test2.json');

			settingsLib.initialize(
				defaultOptions,
				function (err, settings) {
					should.not.exist(err);
					should.exist(settings);
					should.exist(settingsLib.commandLineConfig);
					should.not.exist(settings["extra-key"]);

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - 2);

					done();
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
					settings["test-key"].should.equal('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - 2);

					done();
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
					settings["test-key"].should.equal('test-value-override-again');

					// clean up
					process.argv = process.argv.slice(0, process.argv.length - 2);
					delete process.env.NODE_ENV;

					done();
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
					process.argv = process.argv.slice(0, process.argv.length - 2);

					done();
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
					process.argv = process.argv.slice(0, process.argv.length - 2);

					done();
				});
		});
	});
});
