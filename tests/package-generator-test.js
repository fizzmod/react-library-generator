
const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const fs = require('fs');
const tmp = require('tmp-promise');
const util = require('util');
const MockFS = require('mock-fs');
const MockRequire = require('mock-require');

const PATH_PREFIX = '/var/www';

MockRequire('child_process', {
	exec: (cmd, callback) => {
		if(cmd)
			callback(null, true, 'strerr');
		else
			callback(new Error(), '', 'stderr');
	}
});

const childProcess = require('child_process');

const promptsMock = require('../mocks/prompts-mock');

MockRequire('prompts', promptsMock);

const Generator = require('../lib/package-generator');

const generator = new Generator();

const mockDirectories = () => {
	MockFS({
		template: {
			'__packageName__.js': '[[packageNameComponent]]'
		},
		'/var/www': {},
		'/tmp/mocked-tmp': {}
	});
};

const stubTmp = () => {
	sandbox.stub(tmp, 'dirSync').returns({
		name: '/tmp/mocked-tmp',
		removeCallback: () => { }
	});
};

const readFile = util.promisify(fs.readFile);

describe('Generator', () => {

	beforeEach(() => {
		sandbox.stub(console, 'log').callsFake(); // Necesario para borrar los mensajes del generator
		sandbox.stub(process, 'exit').callsFake(); // Necesario para evitar que se cierren los tests
		mockDirectories();
		stubTmp();
	});

	afterEach(() => {
		MockFS.restore();
		sandbox.restore();
	});

	after(() => {
		MockRequire.stopAll();
	});

	describe('execute()', () => {

		context('when executes the package generator', () => {

			context('when generates the package with a domain/scope', () => {

				it('should generate into the @domain directory', async () => {

					promptsMock.inject([
						'mocked package', // Package name
						'@domain', // Package domain
						PATH_PREFIX,
						true, // Use @domain/package-name dir?
						'description', // Package description
						false // Setup package repo and dependencies?
					]);


					await assert.doesNotReject(generator.execute());

					const result = readFile('/var/www/domain/mocked-package/mocked-package.js', 'utf-8');

					await assert.doesNotReject(result);

					assert.deepEqual(await result, 'MockedPackage');
				});

				it('should generate into the specified directory', async () => {

					promptsMock.inject([
						'mocked package', // Package name
						'@domain', // Package domain
						PATH_PREFIX,
						false, // Use @domain/package-name dir?
						'mocked-package', // User specified package dir
						'description', // Package description
						false // Setup package repo and dependencies?
					]);

					await assert.doesNotReject(generator.execute());

					const result = readFile('/var/www/mocked-package/mocked-package.js', 'utf-8');

					await assert.doesNotReject(result);

					assert.deepEqual(await result, 'MockedPackage');
				});

			});

			context('when generate and setup the package repo and dependencies', () => {

				it('should generate the package with suggested repository', async () => {

					sandbox.stub(childProcess, 'exec').callsFake((cmd, callback) => {
						callback();
					});

					promptsMock.inject([
						'mocked package', // Package name
						'', // Package domain
						PATH_PREFIX,
						'mocked-package', // User specified package dir
						'description', // Package description
						true, // Setup package repo and dependencies?
						'🐱 GitHub', // Select the repository host...
						true,
						'organization',
						true, // Use suggested repository?
						'username', // Git repository user name
						'email@mail.com' // Git repository user email
					]);

					await assert.doesNotReject(generator.execute());

					const result = readFile('/var/www/mocked-package/mocked-package.js', 'utf-8');

					await assert.doesNotReject(result);

					assert.deepEqual(await result, 'MockedPackage');
				});

				it('should generate the package with the specified repository and development branch', async () => {

					promptsMock.inject([
						'mocked package', // Package name
						'', // Package domain
						PATH_PREFIX,
						'mocked-package', // User specified package dir
						'description', // Package description
						true, // Setup package repo and dependencies?
						'🐱 GitHub', // Select the repository host...
						true,
						'',
						false, // Use suggested repository?
						'username', // Git repository user name
						'email', // Invalid email for coverage of validate line
						false, // Use suggested repository (from repository host and username)?
						'https://github.com/sarasa/sarasa.git', // User specified repository
						true, // Create a development branch?
						'new-branch' // New branch name
					]);

					await assert.doesNotReject(generator.execute());

					const result = readFile('/var/www/mocked-package/mocked-package.js', 'utf-8');

					await assert.doesNotReject(result);

					assert.deepEqual(await result, 'MockedPackage');
				});

			});

			it('should generate the package with not organization', async () => {

				promptsMock.inject([
					'mocked package', // Package name
					'', // Package domain
					PATH_PREFIX,
					'mocked-package', // User specified package dir
					'description', // Package description
					true, // Setup package repo and dependencies?
					'🐱 GitHub', // Select the repository host...
					false, // not use organization
					'username', // Git repository user name
					'email@mail.com', // Git repository user email
					true // Use suggested repository (from repository host and username)?
				]);

				await assert.doesNotReject(generator.execute());

				const result = readFile('/var/www/mocked-package/mocked-package.js', 'utf-8');

				await assert.doesNotReject(result);

				assert.deepEqual(await result, 'MockedPackage');
			});

			it('should log an error message when any of the execute functions throws', async () => {

				const stubConsoleError = sandbox.stub(console, 'error');
				stubConsoleError.callsFake();

				promptsMock.inject([
					'mocked package', // Package name
					'@domain', // Package domain
					PATH_PREFIX,
					true, // Use @domain/package-name dir?
					'description', // Package description
					false // Setup package repo and dependencies?
				]);

				sandbox.stub(generator, 'createTmpFiles').rejects();

				await assert.doesNotReject(generator.execute());

				assert.deepEqual(stubConsoleError.calledOnce, true);
			});

		});

	});

	describe('File and directories R/W errors', () => {

		describe('replaceParamsInFile()', () => {

			it('should reject when can\'t write content into the file', async () => {

				MockFS({
					'test.txt': MockFS.file({
						mode: 0o555,
						content: '[[test]]'
					})
				});

				await assert.rejects(generator.replaceParamsInFile('test.txt', { test: 'sarasa' }));
			});

		});

		describe('replaceFileName()', () => {

			it('should reject when can\'t rename the file', async () => {

				MockFS({
					test: MockFS.directory({
						mode: 0o000,
						items: {
							'__test__.txt': ''
						}
					})
				});

				await assert.rejects(generator.replaceFileName('./test/__test__.txt', { test: 'sarasa' }));
			});

		});

		describe('generateFiles()', () => {

			it('should reject when can\'t find the origin/target directory', async () => {

				sandbox.stub(generator, 'fixTargetDir').throws();

				await assert.rejects(generator.generateFiles('./testA', './testB'));
			});

			it('should reject when can\'t read/write the origin/target directory', async () => {

				MockFS({
					testA: {
						'test.txt': ''
					},
					testB: {
						'test.txt': ''
					}
				});

				await assert.rejects(generator.generateFiles('./testA', './testB'));
			});

		});

		describe('fixTargetDir()', () => {

			it('should reject when can\'t create the new directory', async () => {

				MockFS({
					test: MockFS.directory({
						mode: 0o555
					})
				});

				await assert.rejects(generator.fixTargetDir('./test/@domain/mocked-package'));

			});

		});

		describe('createTmpFiles()', () => {

			it('should reject when can\'t copy sources from src to tmp directory', async () => {

				MockFS({
					src: MockFS.directory({
						mode: 0o000,
						items: {
							'test.txt': ''
						}
					})
				});

				assert.rejects(generator.createTmpFiles());

			});

		});

	});

	describe('build()', () => {

		it('should reject when try to build with an invalid package name', async () => {

			promptsMock.inject([
				'' // Package name
			]);

			await assert.rejects(generator.build());
		});

		it('should reject when try to build with an invalid package scope', async () => {

			promptsMock.inject([
				'mocked package',
				'@invalid*scope*name'
			]);

			await assert.rejects(generator.build());
		});

		it('should not reject when try to build with an invalid repository user name / email', async () => {

			promptsMock.inject([
				'mocked package', // Package name
				'', // Package domain
				PATH_PREFIX,
				'mocked-package', // User specified package dir
				'description', // Package description
				true, // Setup package repo and dependencies?
				'🐱 GitHub', // Select the repository host...
				true,
				'organization',
				false, // Use suggested repository?
				'', // Git repository user name
				'' // Git repository user email
			]);

			await assert.doesNotReject(generator.build());
		});

	});

	describe('execCommand()', () => {
		it('should reject when childProcess.exec returns an error', async () => {
			assert.rejects(generator.execCommand());
		});
	});

});
