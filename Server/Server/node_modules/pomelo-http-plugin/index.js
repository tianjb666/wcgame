'use strict';
module.exports = {

	components: __dirname + '/lib/components/',

	events: __dirname + '/lib/events/',

	beforeFilters: [],
	afterFilters: [],

	filter: function(filter) {
		if (filter.before) {
			this.beforeFilters.push(filter.before.bind(filter));
		}
		if (filter.after) {
			this.afterFilters.push(filter.after.bind(filter));
		}
	},

	beforeFilter: function(filter) {
		this.beforeFilters.push(filter);
	},

	afterFilter: function(filter) {
		this.afterFilters.push(filter);
	},

};