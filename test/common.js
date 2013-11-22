var chai = require('chai');
global.should = chai.should();
global.assert = chai.assert;

global.requireWithCoverage = function (libName) {
	'use strict';

	if (process.env.NODE_SETTINGSLIB_COVERAGE) {
		return require('../lib-cov/' + libName + '.js');
	}

	if (libName === 'index') {
		return require('../lib');
	} else {
		return require('../lib/' + libName + '.js');
	}
};
