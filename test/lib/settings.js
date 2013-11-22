describe('settings', function () {

	var
		defaultOptions,
		settingsLib;

	beforeEach(function () {
		defaultOptions = {
			baseConfigPath : 'test/baseConfig.json'
		};

		settingsLib = null;
		settingsLib = requireWithCoverage('settings');
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

		it('should not load branch config if not present', function (done) {
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

		it('should load branch config if present', function (done) {
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

		it('should not allow extra fields to propegate from config sources if baseConfig is set', function (done) {
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

		it('should propegate all fields from config sources if baseConfig is not set', function (done) {
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
	});
});
