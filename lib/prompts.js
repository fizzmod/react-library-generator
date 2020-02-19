const prompts = require('prompts');
const path = require('path');
const chalk = require('chalk');
const { camelCaseToDashCase, dashesAndSpacesToTitleCase, toPathFriendly } = require('./utils');

const PATH_PREFIX = '/var/www';

class Prompts {
	static get repositories() {
		const REPOSITORY_PREFIXES = {
			'🐱 GitHub': 'https://github.com/USER_ORG',
			'🗑️ BitBucket': 'https://bitbucket.org/USER_ORG'
		};

		const repositories = Object.keys(REPOSITORY_PREFIXES).map(repoPrefix => {
			return {
				title: repoPrefix,
				value: REPOSITORY_PREFIXES[repoPrefix]
			};
		});

		repositories.push({
			title: '🤔 Other',
			value: 'other'
		});

		return repositories;
	}

	static async execute() {
		return prompts([
			{
				type: 'text',
				name: 'packageName',
				message: '📦 Type the package name:',
				validate: value => (
					!value.trim() || toPathFriendly(value).length < value.length ? 'Package name is required and must not contain invalid characters' : true
				),
				format: value => dashesAndSpacesToTitleCase(value)
			},
			{
				type: 'text',
				name: 'packageScope',
				message: '🌐 Type the package scope (if necessary):',
				validate: value => (
					value && (toPathFriendly(value).length < value.length || !value.includes('@')) ?
						'The scope must not contain invalid characters and must include "@"' : true
				),
				format: value => camelCaseToDashCase(value)
			},
			{
				type: 'text',
				name: 'pathPrefix',
				message: '📂 Path prefix:',
				initial: PATH_PREFIX
			},
			{
				type: prev => (prev ? 'confirm' : null),
				name: 'targetDir',
				message: (prev, values) => {
					return `🗂️  Use ${chalk.cyan(
						path.join(values.pathPrefix, values.packageScope.replace('@', ''), camelCaseToDashCase(values.packageName))
					)} as package dir? (Y/n)`;
				},
				initial: true,
				format: (value, values) => (value ? path.join(values.packageScope.replace('@', ''), camelCaseToDashCase(values.packageName)) : false)
			},
			{
				type: prev => (!prev ? 'text' : null),
				name: 'targetDir',
				message: (prev, values) => `📂 Type the package dir: ${chalk.cyan(values.pathPrefix)}`,
				initial: (prev, values) => `${camelCaseToDashCase(values.packageName)}`,
				format: value => path.normalize(toPathFriendly(value))
			},
			{
				type: 'text',
				name: 'packageDescription',
				message: '📝 Type the description of your package (you probablly don\'t know it):'
			},
			{
				type: 'confirm',
				name: 'setupPackage',
				message: '⚙️  Do you want to setup your package repository and dependencies? (Y/n)',
				initial: true
			},
			{
				type: prev => (prev ? 'select' : null),
				name: 'repositoryPrefix',
				message: '⚔️️  Select the repository host that your package will use:',
				choices: this.repositories,
				hint: '- Up/Down keys to select. Enter to submit'
			},
			{
				name: 'packageRepository',
				type: (prev, values) => (prev !== 'other' && values.setupPackage ? 'confirm' : null),
				message: '⚔️️ Its a package for organization?',
				initial: true,
				format: value => value || 'other'
			},
			{
				type: prev => (prev && prev !== 'other' ? 'text' : null),
				name: 'repositoryPrefix',
				message: '⚔️️ Organization name',
				validate: value => (
					!value.trim() ? 'Package name is required and must not contain invalid characters' : true
				),
				format: (value, values) => values.repositoryPrefix.replace(path.parse(path.normalize(values.repositoryPrefix)).name, value)

			},
			{
				type: (prev, values) => (values.setupPackage && values.repositoryPrefix !== 'other' && values.packageRepository !== 'other' ? 'confirm' : null),
				name: 'packageRepository',
				message: (prev, values) => {
					if(values.repositoryPrefix) {
						return `🗃  Use ${
							chalk.cyan(`${values.repositoryPrefix}/${camelCaseToDashCase(values.packageName)}.git`)
						} as repository remote origin? (Y/n)`;
					}
					return '';
				},
				initial: true,
				format: (value, values) => (value ? `${values.repositoryPrefix}/${camelCaseToDashCase(values.packageName)}` : 'other')
			},
			{
				type: (prev, values) => (values.setupPackage ? 'text' : null),
				name: 'repositoryUserName',
				message: '👤 Type the repository user name:',
				validate: value => (!value.trim() ? 'The repository user name is required' : true)
			},
			{
				type: (prev, values) => (values.setupPackage ? 'text' : null),
				name: 'repositoryUserEmail',
				message: '✉️  Type the repository user email:',
				validate: value => (!value.trim() || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(value) ? 'A valid email address is required' : true)
			},
			{
				type: (prev, values) => (values.setupPackage && values.packageRepository === 'other' ? 'confirm' : null),
				name: 'packageRepository',
				message: (prev, values) => {
					if(values.repositoryPrefix) {
						return `🗃  Use ${chalk.cyan(`${
							values.repositoryPrefix.replace(path.parse(path.normalize(values.repositoryPrefix)).name, values.repositoryUserName)
						}/${camelCaseToDashCase(values.packageName)}.git`)} as repository remote origin? (Y/n)`;
					}
					return '';
				},
				format: (value, values) => (value ?
					`${values.repositoryPrefix.replace(
						path.parse(path.normalize(values.repositoryPrefix)).name, values.repositoryUserName
					)}/${camelCaseToDashCase(values.packageName)}` : 'other'
				)
			},
			{
				type: (prev, values) => (values.setupPackage && (values.packageRepository === 'other' || values.repositoryPrefix === 'other') ? 'text' : null),
				name: 'packageRepository',
				message: '🌎 Type the full repository URL:',
				format: (value, values) => (value ? value.replace('.git', '') : `${values.repositoryPrefix}/${camelCaseToDashCase(values.packageName)}`)
			}
		], {
			onCancel: () => {
				console.log(chalk.red('😓 Operation cancelled'));
				process.exit(0);
			}
		});
	}
}

module.exports = Prompts;
