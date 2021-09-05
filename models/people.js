let mongoose = require('mongoose');
// mongoose.set('debug', true);

let peopleSchema = mongoose.Schema({
	firstName:{
		type: String,
		required: true
	},
	lastName:{
		type: String,
		required: true
	},
	country:{
		type: String,
		required: true
	},
	type:{
		type: String,
		required: true
	},
	color:{
		type: String,
		required: false
	},
	followers:{
		type: Array
	},
	url_name:{
		type: String,
		required: true
	},
	added:{
		type: String,
		required: true
	}
},{collection: 'people'});

module.exports = mongoose.model('people', peopleSchema);