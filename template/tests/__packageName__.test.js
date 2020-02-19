import React from 'react';
import [[packageNameComponent]] from '../src';
import { shallow } from 'enzyme';

describe('test [[packageNameComponent]]', () => {
	it('should display text', () => {
		const wrapper = shallow(<[[packageNameComponent]]>Text</[[packageNameComponent]]>);
		expect(wrapper.contains('Text')).toBe(true);
	});
});
