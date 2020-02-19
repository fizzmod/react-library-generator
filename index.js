#!/usr/bin/env node

const Generator = require('./lib/package-generator');

(async () => {
	const generator = new Generator();
	await generator.execute();
})();
