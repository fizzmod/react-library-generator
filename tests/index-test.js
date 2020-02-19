const MockRequire = require('mock-require');

class Generator {
	async execute() {
		return true;
	}
}

describe('index', () => {

	before(() => {
		MockRequire('../lib/package-generator', Generator);
	});

	after(() => {
		MockRequire.stopAll();
	});

	it('should run the index script without problems', () => {
		const index = require('../index'); // eslint-disable-line
	});

});
