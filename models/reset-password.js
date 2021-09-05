let mongoose = require('mongoose');

let resetPasswordSchema = mongoose.Schema({
	email:{
		type: String,
		required: true
	},
	id:{
		type: String,
		required: true
	},
	createdAt: {
		type: Date, 
		default: Date.now, 
		expires: '20m'
	}
},{collection: 'resetPassword'});

// mongoose.set('useNewUrlParser', true);
// mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
// resetPasswordSchema.index({"expire_at": 1 }, { expireAfterSeconds: 5 } );

module.exports = mongoose.model('resetPassword', resetPasswordSchema);