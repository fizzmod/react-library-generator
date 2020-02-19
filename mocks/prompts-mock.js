const prompts = require('prompts');

const promptsMock = async (items = [], options = {}) => {

	const values = await prompts(items, options);

	Object.keys(values).forEach(key => {
		if(values[key] === undefined)
			values[key] = '';
	});

	items.forEach(item => {
		Object.keys(item).forEach((key, i) => {

			if(typeof item[key] === 'function') {
				if(key === 'format' || key === 'validate')
					try {	item[key](values[item.name], values); } catch(e) { /* Don't care about this */ }
				else
					try { item[key](values[Object.keys(item)[i - 1]], values); } catch(e) { /* Don't care about this */ }
			}
		});
	});

	if(options.onCancel && typeof options.onCancel === 'function')
		options.onCancel();

	return values;
};

promptsMock.inject = (items = []) => {
	prompts.inject(items);
};

module.exports = promptsMock;
