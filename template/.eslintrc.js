module.exports = {
	extends: ['prettier', 'prettier/react'],
	plugins: ['babel', 'prettier'],
	parser: 'babel-eslint',
	rules: {
		'prettier/prettier': 'error'
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.jsx', '.json'],
				moduleDirectory: ['node_modules', 'src']
			}
		}
	}
};
