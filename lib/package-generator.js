const { camelCase, words, upperFirst } = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const recursiveReaddir = require('recursive-readdir');
const tmp = require('tmp-promise');
const util = require('util');
const chalk = require('chalk');
const childProcess = require('child_process');
const ncp = util.promisify(require('ncp').ncp);
const Prompts = require('./prompts');

const mkdir = util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);
const rename = util.promisify(fs.rename);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

class Generator {

	createTmpDir() {
		this.tmpDirObj = tmp.dirSync();
		return this.tmpDirObj.name;
	}


	async createTmpFiles() {
		const tmpPath = this.createTmpDir();

		try {
			await ncp(path.join(__dirname, '..', 'template'), tmpPath);
			return tmpPath;

		} catch(err) {
			throw new Error(err);
		}
	}


	cleanTmpDir() {
		rmdir(this.tmpDirObj.name, () => {
			this.tmpDirObj.removeCallback();
		});
	}

	parseFileContent(content, replacements) {
		for(const [key, replacement] of Object.entries(replacements))
			content = content.replace(new RegExp(`\\[\\[${key}\\]\\]`, 'g'), replacement);

		return content;
	}

	parseFileName(file, replacements) {
		for(const [key, replacement] of Object.entries(replacements))
			file = file.replace(new RegExp(`__${key}__`, 'g'), replacement);

		return file;
	}


	replaceFileName(file, replacements) {
		return rename(file, this.parseFileName(file, replacements));
	}


	async replaceParamsInFile(file, replacements) {
		const fileContent = await readFile(file, 'utf-8');
		const parsedFile = this.parseFileContent(fileContent, replacements);
		return writeFile(file, parsedFile);
	}

	async parseTmpFiles(tmpPath, replacements) {
		// Primero reemplazamos los nombres de los archivos
		let files = await recursiveReaddir(tmpPath);
		let promises = files.map(file => this.replaceFileName(file, replacements));
		await Promise.all(promises);

		// Despues los contenidos
		files = await recursiveReaddir(tmpPath);
		promises = files.map(file => this.replaceParamsInFile(file, replacements));
		await Promise.all(promises);
	}


	fixTargetDir(targetDir) {
		return mkdir(path.parse(targetDir).dir, { recursive: true });
	}


	async generateFiles(tmpPath, targetDir) {
		try {
			await rename(tmpPath, targetDir);
		} catch(err) {
			if(err.code === 'ENOENT') {
				await this.fixTargetDir(targetDir);
				await this.generateFiles(tmpPath, targetDir);
				return;
			}

			throw err;
		}
	}

	async build() {
		const data = await Prompts.execute();

		const {
			packageName,
			packageScope,
			targetDir,
			pathPrefix,
			setupPackage,
			packageRepository,
			...others
		} = data;

		const name = words(packageName)
			.map(w => w.toLowerCase())
			.join('-');

		return {
			targetDir: path.join(pathPrefix, targetDir),
			setupPackage,
			replacements: {
				packageName: name,
				packageScope: packageScope ? packageScope + '/' : '',
				packageNameComponent: upperFirst(camelCase(name)),
				packageRepository: packageRepository ? packageRepository + '.git' : '',
				gitignore: '.gitignore',
				...others
			}
		};
	}

	execCommand(command) {
		return new Promise((resolve, reject) => {

			childProcess.exec(command, (err, stdout, stderr) => {

				if(err)
					return reject(err);

				resolve(stderr);
			});
		});
	}


	async setupPackage(buildParams) {
		console.log('\n🛠  Setting up your package repository and dependencies...');

		const stderr = await this.execCommand(`
			cd ${buildParams.targetDir};
			git init;
			git config --local user.name "${buildParams.replacements.repositoryUserName}";
			git config --local user.email "${buildParams.replacements.repositoryUserEmail}";
			git remote add origin ${buildParams.replacements.packageRepository};
			git commit -m "Initial commit";
			npm i --loglevel=error;
		`);

		if(stderr)
			console.log(`\n➡️  Console output:\n${stderr}`);
	}

	async execute() {
		try {

			const buildParams = await this.build();

			const tmpPath = await this.createTmpFiles();

			await this.parseTmpFiles(tmpPath, buildParams.replacements);

			await this.generateFiles(tmpPath, buildParams.targetDir);

			this.cleanTmpDir();

			if(buildParams.setupPackage)
				await this.setupPackage(buildParams);


			console.log(`\nStart developing your package:\ncd ${chalk.cyan(buildParams.targetDir)}`);

			console.log('\nAll done, happy coding! 💪\n');
		} catch(err) {
			console.error(
				chalk.red(`\n💀 An error ocurred while creating the package: ${err.message}\n`)
			);
			process.exit(1);
		}
	}
}


module.exports = Generator;
