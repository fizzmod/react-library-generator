const toPathFriendly = string => {
	return string.replace(/[\\"<>|?*]/g, '');
};

const dashesAndSpacesToTitleCase = string => {

	let result = '';

	for(let index = 0; index < string.length; index++) {

		let character = string[index];

		if(string[index - 1] === ' ' || string[index - 1] === '-')
			character = character.toUpperCase();

		result += character;

	}

	return result.substr(0, 1).toUpperCase() + result.substr(1)
		.replace(/ /g, '')
		.replace(/-/g, '');
};

const camelCaseToDashCase = string => {
	return dashesAndSpacesToTitleCase(string)
		.replace(/([A-Z])/g, match => `-${match[0].toLowerCase()}`)
		.replace(/^-/, '');
};

module.exports = {
	camelCaseToDashCase,
	dashesAndSpacesToTitleCase,
	toPathFriendly
};
