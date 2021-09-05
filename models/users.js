let mongoose = require('mongoose');
// mongoose.set('debug', true);

let usersSchema = mongoose.Schema({
	_id:{
		type: mongoose.Schema.Types.ObjectId,
		required: false
	},
	firstName:{
		type: String,
		required: true
	},
	lastName:{
		type: String,
		required: true
	},
	alias:{
		type: String,
		required: true
	},
	password:{
		type: String,
		required: true
	},
    url_name:{
    	type: String,
    	required: true
    },
	email:{
		type: String,
		required: true
	},
   	country:{
   		type: String,
   		required: true
   	},
   	color:{
   		type: String,
   		required: true
   	},
    type:{
    	type: String,
    	required: true
    },
    joined:{
    	type: String,
    	required: true
    },
    followers:{
    	type: Array,
    	required: true
    },
	following:{
		type: Array,
		required: true
	},
	follower_count:{
		type: String,
		required: true
	},
	following_count:{
		type: String,
		required: true
	},
	reviews_submitted:{
		type: Number,
		required: true
	},
	notifications:{
		type: Array,
		required: false
	}
},{collection: 'users'});

module.exports = mongoose.model('users', usersSchema);