'use strict';

const assert = require('assert');
const { sortItems } = require('../assets/scripts/ecosystem-filters.js');

const sample = () => [
	{ name: 'Beta',  added: '2026-05-01' },
	{ name: 'Alpha', added: '2026-09-10' },
	{ name: 'Gamma' },
	{ name: 'Delta', added: '2026-05-01' }
];

const names = list => list.map(i => i.name);

// Newest first; ties keep their curated order; undated items come last.
let list = sample();
sortItems(list, 'newest');
assert.deepStrictEqual(names(list), ['Alpha', 'Beta', 'Delta', 'Gamma']);

// Alphabetical both ways.
list = sample();
sortItems(list, 'az');
assert.deepStrictEqual(names(list), ['Alpha', 'Beta', 'Delta', 'Gamma']);

list = sample();
sortItems(list, 'za');
assert.deepStrictEqual(names(list), ['Gamma', 'Delta', 'Beta', 'Alpha']);

// Unknown mode (the default) must not reorder anything.
list = sample();
sortItems(list, 'default');
assert.deepStrictEqual(names(list), ['Beta', 'Alpha', 'Gamma', 'Delta']);

console.log('ecosystem-filters: all assertions passed');
