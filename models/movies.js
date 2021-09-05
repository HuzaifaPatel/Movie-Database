let mongoose = require('mongoose');

let reviewsSubSchema = mongoose.Schema({
	user_id:{
		type: String,
		required: true
	},
	message:{
		type: String,
		required: false
	},
	movie_name:{
		type: String,
		required: true
	},
	date:{
		type: String,
		required: true
	},
	basic_review:{
		type: Number,
		required: false
	},
	user:{
		type: Object,
		required: true
	}
});

let moviesSchema = mongoose.Schema({
	Title:{
		type: String,
		required: true
	},
	Released:{
		type: String,
		required: true
	},
	Genre:{
		type: String,
		required: true
	},
	Year:{
		type: String,
		required: true
	},
	Runtime:{
		type: String,
		required: true
	},
	Rated:{
		type: String,
		required: true
	},
	Country:{
		type: String,
		required: true
	},
	Director:{
		type: String,
		required: true
	},
	Actors:{
		type: String,
		required: true
	},
	Writer:{
		type: String,
		required: true
	},
	Trailer:{
		type: String,
		required: false
	},
	Plot:{
		type: String,
		required: true
	},
	Poster:{
		type: String,
		required: false
	},
	sumOfRatings:{
		type: Number,
		required: true
	},
	Rating:{
		type: Number,
		required: true
	},
	Reviews: [reviewsSubSchema]
});

module.exports = mongoose.model('movies', moviesSchema);