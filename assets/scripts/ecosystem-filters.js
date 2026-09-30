'use strict';

// Sorting rules for the ecosystem and archive listings.
// Pure functions over the item array, kept out of the page so the ordering
// can be reasoned about and tested on its own.

const byNameAsc = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
const byNameDesc = (a, b) => b.name.localeCompare(a.name, 'en', { sensitivity: 'base' });

// Newest first; items without a date sort after dated ones.
const byNewest = (a, b) => (b.added || '').localeCompare(a.added || '');

const SORT_COMPARATORS = {
	az: byNameAsc,
	za: byNameDesc,
	newest: byNewest
};

// Sorts the list in place for a known mode; an unknown mode (e.g. the default,
// curated order) leaves the list untouched.
function sortItems(list, mode) {
	const comparator = SORT_COMPARATORS[mode];
	if (comparator) list.sort(comparator);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { sortItems, SORT_COMPARATORS };
}
