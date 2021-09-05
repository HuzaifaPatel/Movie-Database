function getMovie(title, movies){
	for(let keys in movies){
		if(movies[keys]['Title'].toLowerCase().replace(/\s/g, "-") == title){
			return movies[keys];
		}
	}

	return null;
}

// used to list all the movies in /movies
function splitMovieObject(allMovies){
	// avo_ids changing actual genre values which we will need throughout the system
	let allMoviesCopy = JSON.parse(JSON.stringify(allMovies));

	numOfMovies = allMovies.length;
	var moviesPerColumn = -1; // used if length of param object is even

	var numOfMoviesInColumnOne = -1; // used if it's odd
	var numOfMoviesInColumnTwo = -1;
	
	var moviesInColumnOne = [];
	var moviesInColumnTwo = [];

	maxGenreLength = 20;

	if((numOfMovies % 2) == 0){
		moviesPerColumn = numOfMovies / 2;
	}else{
		numOfMoviesInColumnOne = (numOfMovies + 1) / 2;
		numOfMoviesInColumnTwo = (numOfMovies - 1) / 2;
	}

	if(moviesPerColumn == -1){
		for(i = 0; i < numOfMoviesInColumnOne; i++){
			// if(!isCorrectGenreLength(allMoviesCopy[i])){
			// 	allMoviesCopy[i]['Genre'] = allMoviesCopy[i]['Genre'].substring(0,maxGenreLength) + "...";
			// }
			moviesInColumnOne.push(allMoviesCopy[i]);
		}

		for(i = numOfMoviesInColumnOne; i<numOfMovies; i++){
			// if(!isCorrectGenreLength(allMoviesCopy[i])){
			// 	allMoviesCopy[i]['Genre'] = allMoviesCopy[i]['Genre'].substring(0,maxGenreLength) + "...";
			// }
			moviesInColumnTwo.push(allMoviesCopy[i]);
		}

	}else{
		for(i = 0; i < moviesPerColumn; i++){
			// if(!isCorrectGenreLength(allMoviesCopy[i])){
			// 	allMoviesCopy[i]['Genre'] = allMoviesCopy[i]['Genre'].substring(0,maxGenreLength) + "...";
			// }
			moviesInColumnOne.push(allMoviesCopy[i]);
		}

		for(i = moviesPerColumn; i < numOfMovies; i++){
			// if(!isCorrectGenreLength(allMoviesCopy[i])){
			// 	allMoviesCopy[i]['Genre'] = allMoviesCopy[i]['Genre'].substring(0,maxGenreLength) + "...";
			// }
			moviesInColumnTwo.push(allMoviesCopy[i]);
		}
	}

	splitMovies = {moviesInColumnOne, moviesInColumnTwo};
	return splitMovies;
}

function isCorrectGenreLength(movie){
	if(movie.Genre.length <= 20){
		return true;
	}

	return false;
}

function setCorrectGenreLength(){

}

function movieGenresToList(movie){
	return movie['Genre'].split(',');
}

function inverseParam(title){
	param = title.split("-");

	for(let i = 0; i<param.length; i++){
		param[i] = param[i][0].toUpperCase() + param[i].slice(1);
	}

	return param.join(" ");
}

// set intersection
function genreIntersection(movies, genres){
	relatedMovies = [];

	for(let i  = 0; i<genres.length; i++){
		if(genres[i][0] == " "){
			genres[i] = genres[i].replace(" ", "");
		}
	}

	for(let i = 0; i<movies.length; i++){
		movieGenres = movies[i]['Genre'].split(", ");
		for(let j = 0; j<movieGenres.length; j++){
			if(genres.includes(movieGenres[j])){
				relatedMovies.push(movies[i]);
				break;	
			}
		}
	}
	return relatedMovies;
}

function removeGenreWhiteSpace(genres){
	for(let i = 0; i<genres.length; i++){
		if(genres[i][0] == " "){
			genres[i] = genres[i].replace(" ", "");
		}
	}
}

exports.removeGenreWhiteSpace = removeGenreWhiteSpace;

function getFollowers(users, _id){
	followers = [];

	for(key in users){
		if(users[key]['_id'] != _id){
			if(JSON.stringify(users[key]['following']).includes(_id)){
				followers.push(users[key]);
			}
		}
	}
	return followers;
}

function getFollowing(users, _id){
	following = [];

	for(key in users){
		if(users[key]['_id'] != _id){
			if(JSON.stringify(users[key]['followers']).includes(_id)){
				following.push(users[key]);
			}
		}
	}
	return following;
}

function getPeopleFollowing(users, _id){
	peopleFollowing = [];

	for(key in users){
		if(users[key]['_id'] != _id){
			if(JSON.stringify(users[key]['followers']).includes(_id)){
				peopleFollowing.push(users[key]);
			}
		}
	}
	return peopleFollowing;
}

exports.getPeopleFollowing = getPeopleFollowing;

function getId(index, user){
	return user['following'][index];
}

function getErrors(req){
	req.session.a = req.session.invalidColor;
	req.session.b = req.session.userExists;
	req.session.c = req.session.invalidPassword;
	req.session.d = req.session.userTypeChanged;
	req.session.t = req.session.signInError;
}

function resetErrors(req){
	req.session.userExists = 0;
	req.session.invalidColor = 0;
	req.session.invalidPassword = 0;
	req.session.userTypeChanged = 0;
	req.session.signInError = 0;
}


// edit profile function
function peopleToArray(people, movie){

	var actors = [];
	var writers = [];
	var directors = [];
	var splitPeople = {"actors" : undefined, "writers" : undefined, "directors" : undefined};

	for(i = 0; i<people.length; i++){
		if(people[i]['type'] == "Actor"){
			actors.push(people[i])
		}else if(people[i]['type'] == "Writer"){
			writers.push(people[i]);
		}else{
			directors.push(people[i]);
		}
	}

	splitPeople['actors'] = actors;
	splitPeople['writers'] = writers;
	splitPeople['directors'] = directors;

	return splitPeople;

}



function addReview(newReview, reviews){
	reviews.push(newReview);
}

function createReview(data, title){
	movieName = getMovieName(data);
	var basicReviewValue = "";
	if(basicReviewFilled(data.body.basic_review)){
		basicReviewValue = data.body.basic_review;
	}

	newReview = 
				{
					user_id: data.session.user['_id'], // will need sessions for this
					message: data.body.review_box,
					movie_name: title,
					date: generateDate(),
					basic_review: basicReviewValue,
					user: data.session.user
				}

	return newReview;
}

function canCreateBasicReview(req){
	if(Number(req.body.basic_review) < 0 || Number(req.body.basic_review) > 10){
		return false;
	}

	return true;
}

exports.canCreateBasicReview = canCreateBasicReview;

function canCreateReview(req){
	var checkIfString =/^[a-zA-Z]+$/;
	if((req.body.review_box == "" && req.body.basic_review == "") || (Number(req.body.basic_review) < 0 || Number(req.body.basic_review) > 10 || req.body.basic_review.match(checkIfString))){
		// req.session.invalidBasicReview = -1;
		return false;
	}

	return true;
}

function basicReviewFilled(data){
	if(data != "" && data != "Only input a number"){
		return true;
	}

	return false;
}

function getReviewErrors(req){
	req.session.g = req.session.reviewError;
	req.session.h = req.session.reviewLoginError;
	req.session.y = req.session.invalidBasicReview;
}

function resetReviewErrors(req){
	req.session.reviewError = 0;
	req.session.reviewLoginError = 0;
	req.session.invalidBasicReview = 0;
}

function removeHexCodeInput(){
	let input = document.getElementsByClassName("change-settings")[0];
	input.getElementsByTagName("input")[0].value = "";
}

function getMovieName(data){
	movieName = data.originalUrl.split("/");
	movieName = movieName[2];
	movieName = movieName.split('-');
	for(i = 0; i<movieName.length; i++){
		movieName[i] = movieName[i].charAt(0).toUpperCase() + movieName[i].slice(1);
	}
	movieName = movieName.join(" ");

	return movieName;
}

function generateDate(){
	var today = new Date();
	var day = String(today.getDate()).padStart(2, '0');
	var month = String(today.getMonth() + 1).padStart(2, '0');
	var year = today.getFullYear();
	var suffix = "";

	switch(month){
		case "1":
			month = "January";
			break;
		case "2":
			month = "February";
			break;
		case "3":
			month = "March";
			break;
		case "4":
			month = "April";
			break;
		case "5":
			month = "May";
			break;
		case "6":
			month = "June";
			break;
		case "7":
			month = "July";
			break;
		case "8":
			month = "August";
			break;
		case "9":
			month = "September";
			break;
		case "10":
			month = "October";
			break;
		case "11":
			month = "November";
			break;
		case "12":
			month = "December";
			break;
	}



	return today = month + " " + day + ", " + year;

}

function signOut(){
	document.forms["sign-out-form"].submit();
}

// function userExists(param, members){
// 	for(let keys in members){
// 		if(members[keys]['_id'] == param){
// 			return param;
// 		}
// 	}

// 	return -1;
// }



function userExists(req, users){
	for(let i = 0; i<users.length; i++){
		if("~" + users[i]['alias'].toLowerCase() == "~" + req.body.alias.toLowerCase()){
			return true;
		}
	}

	return false;
}

function isContributor(requester){
	if(requester['type'] === 'Contributor'){
		return "visible";
	}else{
		return "hidden";
	}
}

function canEdit(user, alias, req){
	if(req.session.user == undefined){
		return "hidden";
	}

	if(user['alias'].toLowerCase() == req.session.user['alias'].toLowerCase() && req.session.loggedin){
		return "visible";
	}else{
		return "hidden";
	}
}

function authenticate(requester, requestingUser){
	if(requester == requestingUser){
		return true;
	}
	return false;
}

function canFollow(session, alias){
	if(!session.loggedin){
		return false;
	}

	if(session.user['alias'].toLowerCase() == alias){
		return "hidden";
	}
	return "visible";
}

// function isContributor(user){
// 	if(user.type == "Contributor"){
// 		return true;
// 	}else{
// 		return false;
// 	}
// }

function changeFollowingStatus(session, user){
	if(JSON.stringify(session.user['following']).includes(user[0]['_id'])){
		for(let i = 0; i<session.user['following'].length; i++){
			if(session.user['following'][i] == user[0]['_id']){
				session.user['following'].splice(i, 1);
				return "Follow";
			}
		}
	}

	session.user['following'].push(user[0]['_id']);
	return "Following";
}

function changeFollowerStatus(session, user){
	if(JSON.stringify(user[0]['followers']).includes(session.user['_id'])){
		for(let i = 0; i<user[0]['followers'].length; i++){
			if(user[0]['followers'][i] == session.user['_id']){
				user[0]['followers'].splice(i,1);
				return;
			}
		}
	}

	user[0]['followers'].push(session.user['_id']);
	return;
}

function followStatus(session, user){
	if(!session.loggedin){
		return "Follow";
	}

	if(JSON.stringify(session.user['following']).includes(user['_id'])){
		return "Following";
	}

	return "Follow";
}

function removeFollowing(session, user, idToDelete){
	for(let i = 0; i<session.user['following'].length; i++){
		if(session.user['following'][i] == idToDelete){
			session.user['following'].splice(i, 1);
		}
	}

	for(let i = 0; i<user[0]['followers'].length; i++){
		if(user[0]['followers'][i] == session.user['_id']){
			user[0]['followers'].splice(i, 1);
		}
	}
}


function getAllFollowers(user, users){
	var followingUsers = [];

	for(i = 0; i<user['followers'].length; i++){
		followingUsers.push(users[user['followers'][i]-1]);
	}

	return followingUsers;
}

function getAllFollowing(user, users){
	var followingUsers = [];

	for(i = 0; i<user['following'].length; i++){
		followingUsers.push(users[user['following'][i]-1]);
	}

	return followingUsers;
}

function unfollowUser(index, user){
	index = user['following'].splice(index , 1);
}

function registerUser(){
	var form = document.getElementsByTagName("form")[0];
	var fname = form.getElementsByTagName("input")[0].value;
	var alias = form.getElementsByTagName("input")[1].value;
	var lname = form.getElementsByTagName("input")[2].value;
	var email = form.getElementsByTagName("input")[3].value;
	var country = form.getElementsByTagName("select")[0].value;
	var comment = document.getElementsByTagName("textarea")[0].value;
	var color = "#" + Math.floor(Math.random()*16777215).toString(16);

	var request = new XMLHttpRequest();

	// check if all required fields are filled. If not, don't process request
	if(!dataIsFilled(fname, lname, alias, email)){
		removeMessage();
		sendError();
		return;
	}

	request.onreadystatechange = function(){
		if(this.readyState == 4 & this.status == 200){
		}
	}

	registerInfo = {
		"fname" : fname, 
		"alias" : alias, 
		"lname" : lname, 
		"email" : email, 
		"country" : country, 
		"comment" : comment,
		"color" : color
	};

	// request.open("POST", "http://127.0.0.1:3000/join", true);
	request.open("POST", "http://127.0.0.1:3000/join/", true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify(registerInfo));
	// window.location.replace("http://127.0.0.1:3000/");
	// location.reload();
	removeMessage();
	sendSuccess();
	removeEntries();
}


function checkLoaded(){
	if(document.readyState === "complete"){
		return true;
	}
	return false;
}


function dataIsFilled(fname, lname, alias, email){
	if(fname.length > 0 && lname.length > 0 && alias.length > 0 && email.length > 0){
		return true;
	}
	return false;
}

function sendError(){
	const errorDiv = document.createElement('div');
	errorDiv.className = 'error';

	errorDiv.innerHTML = '<h2>&zwnj; &zwnj; &zwnj; &zwnj; ✘ All entries must be filled in</h2>';

	// div where we have to insert error message
	const insertInto = document.getElementsByClassName('join-content')[0];

	insertInto.insertBefore(errorDiv, insertInto.firstChild);

}

function sendSuccess(){
	const successDiv = document.createElement('div');
	successDiv.className = 'success';

	successDiv.innerHTML = '<h2>&zwnj; &zwnj; &zwnj; &zwnj; ✔ Joined the Movie Database</h2>';

	// div where we have to insert success message
	const insertInto = document.getElementsByClassName('join-content')[0];

	insertInto.insertBefore(successDiv, insertInto.firstChild);
}

function removeMessage(){

	element = document.getElementsByClassName('join-content')[0];
	if(element.firstChild.classList.contains('error') || element.firstChild.classList.contains('success')){
		element.firstChild.remove();
	}
}

function removeEntries(){
	var form = document.getElementsByTagName("form")[0];
	var fname = form.getElementsByTagName("input")[0].value = "";
	var alias = form.getElementsByTagName("input")[1].value = "";
	var lname = form.getElementsByTagName("input")[2].value = "";
	var email = form.getElementsByTagName("input")[3].value = "";
	var country = form.getElementsByTagName("select")[0].value = "";
	var comment = document.getElementsByTagName("textarea")[0].value = "";
}


function addMember(){
	var table = document.getElementsByTagName("table")[0];

	var fname = "Billy";

	var newRow = table.insertRow(1);

	var cell1 = newRow.insertCell(0);
	var cell2 = newRow.insertCell(1);

	cell1.innerHTML = "hihih";
	cell2.innerHTML = "jiji";
}

function populateUser(req){

	const newMember = {
		firstName: req.body.fname,
		alias: req.body.alias,
		url_name: "~"+req.body.alias.toLowerCase().replace(/\s/g, "-"),
		lastName: req.body.lname,
		email: req.body.email,
		password: req.body.password,
		country: req.body.country,
		color: generateColor(),
	    follower_count: "0",
	    following_count: "0",
	    reviews_submitted: "0",
		type: 'Regular', // newly registered members are always members
		joined: generateDate()
	}

	return newMember;
}

function getNewUserErrors(req){
	req.session.n = req.session.newUserExistsError;
	req.session.o = req.session.newUserInvalidInputError;
	req.session.ab = req.session.spacesInUsernameError;

}

function resetNewUserErrors(req){
	req.session.newUserExistsError = 0;
	req.session.newUserInvalidInputError = 0;
	req.session.spacesInUsernameError = 0;
}


function getUser(users, alias){
	for(let i = 0; i<users.length; i++){
		if(users[0]['alias'].toLowerCase() === alias){
			return i;
		}
	}

	return -1;
}

function removeText(){
	let inputValue = document.getElementsByClassName("change-settings")[0];
	inputValue.getElementsByTagName("input")[1].value = "";
}

function isAuthorized(data, members, userID, req){
	if(data.body.color != "Hex Code Value" && data.body.color != ""){
		if(validHexCode(data.body.color)){
			req.session.user['color'] = "#"+data.body.color; // good
			req.session.invalidColor = 1; // good
		}else{
			req.session.invalidColor = -1; // bad
		}
	}

	// if(data.body.alias != ""){
	// 	if(!nameExists(members, data.body.alias)){
	// 		req.session.user['alias'] = data.body.alias // goood
	// 		req.session.user['url_name'] = "~" + data.body.alias.toLowerCase();
	// 		req.session.userExists = 1; //good
	// 	}else{
	// 		req.session.userExists = -1; // bad
	// 	}
	// }

	if(data.body.user_type == "Regular"){
		req.session.user['type'] = "Regular";
		req.session.userTypeChanged = 1;
	}else if(data.body.user_type == "Contributor"){
		req.session.user['type'] = "Contributor";
		req.session.userTypeChanged = 1;
	}
}

function validHexCode(color){
	if(typeof color === 'string' && color.length === 6 && !isNaN(Number('0x' + color))){
		return true;
	}
	return false;
}

function nameExists(members, alias){
	for(i = 0; i<members.length; i++){
		if(members[i]['alias'] == alias){
			return true;
		}
	}

	return false;
}


function sendSuccess(){
	const successDiv = document.createElement('div');
	successDiv.className = 'success';

	successDiv.innerHTML = '<h2>&zwnj; &zwnj; &zwnj; &zwnj; ✔ Successfully edited Profile</h2>';

	// div where we have to insert success message
	const insertInto = document.getElementsByClassName('uam-content')[0];

	insertInto.insertBefore(successDiv, insertInto.firstChild);
}

function sendError(){

}

function invalidColor(){
	const errorDiv = document.createElement('div');
	errorDiv.className = 'error';

	errorDiv.innerHTML = '<h2>&zwnj; &zwnj; &zwnj; &zwnj; ✘ Invalid color in</h2>';

	// div where we have to insert error message
	const insertInto = document.getElementsByClassName('uam-content')[0];

	insertInto.insertBefore(errorDiv, insertInto.firstChild);
}


function changeUser(member, errorCodes, data){
	if(errorCodes['color'] == 10){
		member['color'] = "#" + data.body.color;
	}

	if(errorCodes['alias'] == 10){
		member['alias'] = data.body.alias;
	}

	if(errorCodes['user_type'] == 11){
		member['type'] = data.body.user_type;
	}

	if(errorCodes['user_type'] == 12){
		member['type'] = data.body.user_type;
	}

	return;
}

function findReviews(movies, userId){
	reviews = [];

	for(let i = 0; i<movies.length; i++){
		for(let j = 0; j<movies[i]['Reviews'].length; j++){
			if(movies[i]['Reviews'].length > 0){
				if(movies[i]['Reviews'][j]['user_id'] == userId){
					// console.log(movies[i]['Reviews'][j]['user_id']);
					reviews.push(movies[i]['Reviews'][j]);
				}
			}
		}
	}
	return reviews;
}

function removeActorLabelValue(){
	document.getElementById('actors').value = "";
}

function removeTrailerLabelValue(){
	document.getElementById('trailer').value = "";
}

function createMovie(data, response){
	// console.log(data.Released.split("-")[0]);
	newMovie = 
	{
		Title: data.Title,
		Released: data.Released,
		Genre: data.Genre,
		Runtime: data.Runtime + " min",
		Year: data.Year,
		Rated: data.Rating,
		Country: data.Country,
		Actors: data.Actors,
		Writer: data.Writer,
		Director: data.Director,
	 	Plot: data.Plot,
	 	Poster: response,
	 	Reviews: [],
	 	sumOfRatings: 0,
	 	Rating: 0
	}

	return newMovie;
}

function getAllNotifiedUsers(users, actor, writer, director){
	notifiedUsers = {"actors" : undefined, "writers" : undefined, "director" : undefined};
	followingActors = [];
	followingWriters = [];
	followingDirectors = [];

	for(let i = 0; i<users.length; i++){
		for(let j = 0; j<users[i]['following'].length; j++){

			if(actor[0].length != 0){
				if(JSON.stringify(users[i]['following'][j]) == JSON.stringify(actor[0]['_id'])){
					followingActors.push(users[i]);
				}
			}
		}

		for(let j = 0; j<users[i]['following'].length; j++){
			if(writer[0].length != 0){
				if(JSON.stringify(users[i]['following'][j]) == JSON.stringify(writer[0]['_id'])){
					followingWriters.push(users[i]);
				}
			}
		}

		for(let j = 0; j<users[i]['following'].length; j++){
			if(director[0].length != 0){
				if(JSON.stringify(users[i]['following'][j]) == JSON.stringify(director[0]['_id'])){
					followingDirectors.push(users[i]);
				}
			}
		}
	}

	notifiedUsers['actors'] = followingActors;
	notifiedUsers['writers'] = followingWriters;
	notifiedUsers['director'] = followingDirectors;

	return notifiedUsers;
}


function getAllEditMovieNotifiedUsers(users, actor, writer, director){
	notifiedUsers = {"actors" : undefined, "writers" : undefined, "director" : undefined};
	followingActors = [];
	followingWriters = [];
	followingDirectors = [];

	for(let i = 0; i<users.length; i++){
		for(let j = 0; j<users[i]['following'].length; j++){
			if (actor.length != 0) {
				if(JSON.stringify(users[i]['following'][j]) == JSON.stringify(actor[0]['_id'])){
					followingActors.push(users[i]);
				}
			}
		}

		for(let j = 0; j<users[i]['following'].length; j++){
			if (writer.length != 0) {
				if(JSON.stringify(users[i]['following'][j]) == JSON.stringify(writer[0]['_id'])){
					followingWriters.push(users[i]);
				}
			}
		}

		for(let j = 0; j<users[i]['following'].length; j++){
			if (director.length != 0) {
				if(JSON.stringify(users[i]['following'][j]) == JSON.stringify(director[0]['_id'])){
					followingDirectors.push(users[i]);
				}
			}
		}
	}

	notifiedUsers['actors'] = followingActors;
	notifiedUsers['writers'] = followingWriters;
	notifiedUsers['director'] = followingDirectors;

	return notifiedUsers;
}

exports.getAllEditMovieNotifiedUsers = getAllEditMovieNotifiedUsers;

exports.getAllNotifiedUsers = getAllNotifiedUsers;


function makeNotifications(notifiedUsers, req, actor, writer, director){
	notifications = [];

	var currentType = actor;

	for(let key in notifiedUsers){
		if(key == "actors"){
			currentType = actor;
		}else if(key == "writers"){
			currentType = writer;
		}else{
			currentType = director;
		}

		for(let i = 0; i<notifiedUsers[key].length; i++){
			newNotification = 
			({
				"alias"		: notifiedUsers[key][i]['alias'],
				"firstName" : currentType[0]['firstName'],
				"lastName"  : currentType[0]['lastName'],
				"message" 	: "A new movie featuring",
				"message_end" : " has been added: ",
				"type" 		: "people",
				"date" 		: generateDate(),
				"color" 	: currentType[0]['color'],
				"movie_name": req.body.Title,
				"movie_url" : req.body.Title.toLowerCase().replace(/\s/g,"-"),
				"url_name"	: currentType[0]['url_name']
			});

			notifications.push(newNotification);
		}
	}

	return notifications;
}

function makeEditMovieNotifications(notifiedUsers, movie, actor, writer, director){
	notifications = [];
	
	var currentType = actor;

	for(let key in notifiedUsers){
		if(key == "actors"){
			currentType = actor;
		}else if(key == "writers"){
			currentType = writer;
		}else{
			currentType = director;
		}

		for(let i = 0; i<notifiedUsers[key].length; i++){
			newNotification = 
			({
				"alias"		: notifiedUsers[key][i]['alias'],
				"firstName" : currentType[0]['firstName'],
				"lastName"  : currentType[0]['lastName'],
				"message" 	: "",
				"message_end" : " was added to the movie ",
				"type" : "people",
				"date" 		: generateDate(),
				"color" 	: currentType[0]['color'],
				"movie_name": movie[0].Title,
				"movie_url" : movie[0].Title.toLowerCase().replace(/\s/g,"-"),
				"url_name"	: currentType[0]['url_name']
			});

			notifications.push(newNotification);
		}
	}

	return notifications;
}

function makeFollowNotification(req){
	return newNotification = 
		{
			"alias" : req.session.user['alias'],
			"firstName" : req.session.user['firstName'],
			"lastName" : req.session.user['lastName'],
			"message" : "",
			"message_end" : "followed you",
			"type" : "users",
			"date" : generateDate(),
			"color" : req.session.user['color'],
			"url_name" : req.session.user['url_name']
		}
}

function getNewReviewNotification(req, movie){
	return newNotification = 
	{
		"alias" : req.session.user['alias'],
		"firstName" : req.session.user['firstName'],
		"lastName" : req.session.user['lastName'],
		"message" : "",
		"message_end" : " has added a new movie review for ",
		"type" : "users",
		"date" : generateDate(),
		"color" : req.session.user['color'],
		"url_name" : req.session.user['url_name'],
		"movie_name" : movie[0].Title,
		"movie_url" : movie[0].Title.toLowerCase().replace(/\s/g,"-")
	}
}

exports.getNewReviewNotification = getNewReviewNotification;

exports.makeFollowNotification = makeFollowNotification;

exports.makeEditMovieNotifications = makeEditMovieNotifications;

function removeNotification(user, index){
	user['notifications'].splice(index, 1);
}

exports.removeNotification = removeNotification;
exports.makeNotifications = makeNotifications;

function addMovie(movies, movie){
	movies.push(movie);
}

function movieExists(movies, name){
	for(i = 0; i<movies.length; i++){
		if(movies[i]['Title'].toLowerCase() == name.toLowerCase()){
			return true;
		}
	}

	return false;
}

function allFieldsFilled(data){
}

function getAddMovieErrors(req){
	req.session.e = req.session.fieldError;
	req.session.m = req.session.movieExists;
	req.session.j = req.session.addMovieContributorError;
	req.session.ge = req.session.numMovies;
}

function resetAddMovieErrors(req){
	req.session.fieldError = 0;
	req.session.movieExists = 0;
	req.session.addMovieContributorError = 0;
	req.session.numMovies = 0;
}

function getAddPeopleErrors(req){
	req.session.f = req.session.personExists;
	req.session.k = req.session.contributorError;
	req.session.p = req.session.fillMoreError;
}

function resetAddPeopleErrors(req){
	req.session.personExists = 0;
	req.session.contributorError = 0;
	req.session.fillMoreError = 0;
}


function personExists(req, people){
	name = req.body.firstName + " " + req.body.lastName;

	for(i = 0; i<people.length; i++){
		personName = people[i]['firstName'] + " " + people[i]['lastName'];
		if(name.toLowerCase() == personName.toLowerCase()){
			return true;
		}
	}
	return false;
}

function addPerson(data){

	newPerson = 
	{
		// id: 		uuidv4(),
		firstName: 	data.body.firstName,
		lastName: 	data.body.lastName,
		url_name:   "~" + data.body.firstName.toLowerCase() + "-" + data.body.lastName.toLowerCase(),
		country:    data.body.country,
		type: 		data.body.type,
		added:      generateDate(),
		color: 		generateColor(),
	}

	return newPerson;

}

function generateColor(){
	// return "#" + Math.floor(Math.random()*16777215).toString(16);
	return "#" + (Math.floor((Math.random()*222)+33).toString(16))+(Math.floor((Math.random()*222)+33).toString(16))+(Math.floor((Math.random()*222)+33).toString(16))
}

function dataFilled(data){
	if(data.body.firstName != "" && data.body.lastName != "" && data.body.type != undefined){
		return true;
	}

	return false;
}

function getFrequentCollaborators(movies, people, name){
	matchedMovies = [];

	for(i = 0; i<people.length; i++){
		people[i]['counter'] = 0;
	}

	for(i = 0; i<movies.length; i++){
		var actors = movies[i]['Actors'];
		var writers = movies[i]['Writer'];
		var directors = movies[i]['Director'];

		actors = actors.replace(/, /g, ",");
		actors = actors.split(",");
		for(j = 0; j<actors.length; j++){
			if(actors[j].toUpperCase() === name.toUpperCase()){
				matchedMovies.push(movies[i]);
			}
		}

		writers = writers.replace(/ *\([^)]*\) */g, ""); // remove all words inside bracket
		writers = writers.split(", ");
		for(j = 0; j<writers.length; j++){
			if(writers[j].toUpperCase() === name.toUpperCase()){
				matchedMovies.push(movies[i]);
			}
		}

		directors = directors.replace(/, /g, ",");
		directors = directors.split(",");
		for(j = 0; j<directors.length; j++){
			if(directors[j].toUpperCase() === name.toUpperCase()){
				matchedMovies.push(movies[i]);
			}
		}
		
	}

	matchedMoviesSet = new Set(matchedMovies);
	matchedMovies = Array.from(matchedMoviesSet);
	// console.log(matchedMovies);

	for(i = 0; i<matchedMovies.length; i++){

		for(k = 0; k<people.length; k++){
			var actors = matchedMovies[i]['Actors'];
			var writers = matchedMovies[i]['Writer'];
			var directors = matchedMovies[i]['Director'];


			personName = people[k]['firstName'].toUpperCase() + " " + people[k]['lastName'].toUpperCase();
			actors = actors.replace(/, /g, ",");
			actors = actors.split(",");
			for(j = 0; j<actors.length; j++){
				if(actors[j].toUpperCase() === personName){
					people[k]['counter'] = people[k]['counter'] + 1;
				}
			}

			writers = writers.replace(/ *\([^)]*\) */g, ""); // remove all words inside bracket
			writers = writers.split(", ");
			for(j = 0; j<writers.length; j++){
				if(writers[j].toUpperCase() === personName){
					people[k]['counter'] = people[k]['counter'] + 1;
				}
			}

			directors = directors.replace(/, /g, ",");
			directors = directors.split(",");
			for(j = 0; j<directors.length; j++){
				if(directors[j].toUpperCase() === personName){
					people[k]['counter'] = people[k]['counter'] + 1;
				}
			}
		}
	}

	matchedPeople = [];

	for(i = 0; i<people.length; i++){
		personName = people[i]['firstName'].toUpperCase() + " " + people[i]['lastName'].toUpperCase();
		if(personName != name.toUpperCase()){
			if(people[i]['counter'] > 1){
				matchedPeople.push(people[i]);
			}
		}
	}

	return matchedPeople;

}

function getLoginError(req){
	req.session.l = req.session.loginError;
}

function resetLoginError(req){
	req.session.loginError = 0;
}

function setMovieAPI(req){
	if(req.query['title'] == undefined){
		req.query['title'] = "";
	}

	if(req.query['genre'] == undefined){
		req.query['genre'] = "";
	}

	if(req.query['year'] == undefined){
		req.query['year'] = "";
	}

	if(req.query['minrating'] == undefined){
		req.query['minrating'] = "";
	}
}

function removeSecretInfo(req){
	req.session.resetUserName = "";
	req.session.resetPassword = "";
}

function resetIsValid(req, user){
	if(req.body.email == "" || user.length == 0){
		req.session.resetPasswordError = -1;
		return false;
	}

	req.session.resetPasswordError = 1;
	return true;
}

function getResetPasswordErrors(req){
	req.session.w = req.session.resetPasswordError;
	req.session.q = req.session.updatePasswordError;
}

function resetResetPasswordErrors(req){
	req.session.resetPasswordError = 0;
	req.session.updatePasswordError = 0;
}
// const { v4: uuidv4 } = require('uuid');

function createResetEmail(req, id){
	var mailOptions = {
	  from: 'themoviedatabasehelp@gmail.com',
	  to: req.body.email,
	  subject: 'The Movie Database - Reset Your Password',
	  text: '',
	  html: '<br>We recieved a request to reset your Movie Database password.</br><br>To reset your password, click the following link:</br><a href=http://localhost:3000/reset/' + id + '>http://localhost:3000/reset/'+ id +'</a></br><br>If you did not request a password reset, please disregard this email.</br><br>DO NOT REPLY TO THIS EMAIL</br>'
	};

	return mailOptions;
}

function sendEmail(email, mailOptions){
	email.transporter.sendMail(mailOptions, function(error, info){});
}

function createResetLink(user, id){
	newResetLink = {
		email : user['email'],
		id : id
	}

	return newResetLink;
}

function getLastTen(movies){
	lastTen = [];
	for(i = 0; i<movies.length; i++){
		if(i >= movies.length-8){
			lastTen.push(movies[i]);
		}
	}

	return lastTen.reverse();
}

function getFilmography(movies, person){
	filmography = []
	personName = person['firstName'] + " " + person['lastName'];

	for(i = 0; i < movies.length; i++){
		if(movies[i]['Actors'].includes(personName) || movies[i]['Writer'].includes(personName) || movies[i]['Director'].includes(personName)){
			filmography.push(movies[i]);
		}
	}

	return filmography;
}

function getEditMovieError(req){
	req.session.r = req.session.editMovieError;
	req.session.s = req.session.personExistsError;
}

function resetEditMovieError(req){
	req.session.editMovieError = 0;
	req.session.personExistsError = 0;
}

// checks if person is already in movie if site contributor wants to add person to movie
function actorExistsInMovie(movie, actor){
	actors = movie['Actors'].split(", ");

	if(actors.includes(actor)){
		return true;
	}

	return false;
}

function writerExistsInMovie(movie, writer){
	writers = movie['Writer'].replace(/ *\([^)]*\) */g, "").split(", "); // remove all words inside bracket

	if(writers.includes(writer)){
		return true;
	}
}

function directorExistsInMovie(movie, director){
	directors = movie['Director'].split(", ");

	if(directors.includes(director)){
		return true;
	}

	return false;
}

function addPeopleToDatabase(movies){
	actors = [];
	writers = [];
	directors = [];

	for(i = 0; i<movies.length; i++){
		a = movies[i]['Actors'].split(", ");

		for(j = 0; j<a.length; j++){
			actors.push(a[j]);
		}

		w = movies[i]['Writer'].replace(/ *\([^)]*\) */g, "").split(", ");

		for(j = 0; j<w.length; j++){
			writers.push(w[j]);
		}

		d = movies[i]['Director'].replace(/ *\([^)]*\) */g, "").split(", ");

		for(j = 0; j < d.length; j++){
			directors.push(d[j]);
		}
	}

	var actorsSet = new Set(actors);
	var writersSet = new Set(writers);
	var directorsSet = new Set(directors);
	
	actors = Array.from(actorsSet);
	writers = Array.from(writersSet);
	directors = Array.from(directorsSet);

	// console.log(actors);
	for(i = 0; i<actors.length; i++){
		for(j = 0; j<writers.length; j++){
			// console.log(actors[i] + " === " + writers[j]);
			if(actors[i] == writers[j]){
				actors.splice(i, 1);
			}

		}
	}

	for(i = 0; i<actors.length; i++){
		for(j = 0; j<directors.length; j++){
			// console.log(actors[i] + " ==== " + directors[j]);
			if(actors[i] == directors[j]){
				actors.splice(i, 1);
			}
		}
	}

	for(i = 0; i<writers.length; i++){
		for(j = 0; j<directors.length; j++){
			// console.log(writers[i] + " === " + directors[j]);
			if(writers[i] == directors[j]){
				writers.splice(i, 1);
			}
		}
	}

	people = [];

	for(i = 0; i < actors.length; i++){
		firstName = actors[i].substr(0, actors[i].indexOf(' '));
		lastName = actors[i].substr(actors[i].indexOf(' ') + 1);

		newActor = 
		{
			firstName: 	firstName,
			lastName: 	lastName,
			url_name:   "~" + firstName.toLowerCase() + "-" + lastName.toLowerCase(),
			country:    'us',
			type: 		"Actor",
			added:      generateDate(),
			color: 		generateColor()
		}

		people.push(newActor);
	}

	for(i = 0; i < writers.length; i++){
		firstName = writers[i].substr(0, writers[i].indexOf(' '));
		lastName = writers[i].substr(writers[i].indexOf(' ') + 1);

		newWriter = 
		{
			firstName: 	firstName,
			lastName: 	lastName,
			url_name:   "~" + firstName.toLowerCase() + "-" + lastName.toLowerCase(),
			country:    'us',
			type: 		"Writer",
			added:      generateDate(),
			color: 		generateColor()
		}

		people.push(newWriter);
	}

	for(i = 0; i < directors.length; i++){
		firstName = directors[i].substr(0, directors[i].indexOf(' '));
		lastName = directors[i].substr(directors[i].indexOf(' ') + 1);

		newDirector = 
		{
			firstName: 	firstName,
			lastName: 	lastName,
			url_name:   "~" + firstName.toLowerCase() + "-" + lastName.toLowerCase(),
			country:    'us',
			type: 		"Director",
			added:      generateDate(),
			color: 		generateColor()
		}

		people.push(newDirector);
	}

	return people;
}

function findCast(movie, people){
	cast = [];

	actors = [];
	writers = [];
	directors = [];

	a = movie[0]['Actors'].split(", ");

	for(j = 0; j<a.length; j++){
		actors.push(a[j]);
	}

	w = movie[0]['Writer'].replace(/ *\([^)]*\) */g, "").split(", ");

	for(j = 0; j<w.length; j++){
		writers.push(w[j]);
	}

	d = movie[0]['Director'].split(", ");

	for(j = 0; j < d.length; j++){
		directors.push(d[j]);
	}

	for(i = 0; i<people.length; i++){
		personName = people[i]['firstName'].toLowerCase() + " " + people[i]['lastName'].toLowerCase();
		for(j = 0; j<actors.length; j++){
			if(personName == actors[j].toLowerCase()){
				cast.push(people[i]);
			}
		}

		for(j = 0; j<writers.length; j++){
			if(personName == writers[j].toLowerCase()){
				cast.push(people[i]);
			}
		}

		for(j = 0; j<directors.length; j++){
			if(personName == directors[j].toLowerCase()){
				cast.push(people[i]);
			}
		}
	}

	castSet = new Set(cast);
	cast = Array.from(castSet);
	return cast;
}

function getAvailableGenres(movie){
	allGenres = ["Comedy", "SCI-FI", "Horror", "Romance", "Action", "Thriller", "Drama", "Mystery", "Crime", "Animation", "Adventure", "Fantasy", "Family", "Biography", "History"];

	movieGenres = movie['Genre'].split(" ");
	for(i = 0; i<movieGenres.length; i++){
		movieGenres[i] = movieGenres[i].replace(",", "");
	}
	setDifference = allGenres.filter(x => !movieGenres.includes(x));
	return setDifference;
}

function findReviewedMovies(movies, reviews){
	reviewedMovies = [];
	for(i = 0; i<movies.length; i++){
		for(j = 0; j<reviews.length; j++){
			if(reviews[j]['movie_name'] == movies[i]['Title']){
				reviewedMovies.push(movies[i]);
			}
		}
	}

	return reviewedMovies;
}

function mergeMovieObjects(reviewedMovies, moviesWithFollowedPeople){
	mergedMovies = [];

	for(i = 0; i<reviewedMovies.length; i++){
		mergedMovies.push(reviewedMovies[i]);
	}

	for(i = 0; i<moviesWithFollowedPeople.length; i++){
		mergedMovies.push(moviesWithFollowedPeople[i]);
	}

	return mergedMovies;
}

function isValidResetLink(resetLinks, id){
	for(i = 0; i<resetLinks.length; i++){
		if(resetLinks[i]['id'] == id['id']){
			return true;
		}
	}

	return false;
}

function removeTextArea(){
	let input = document.getElementsByName("comment")[0];
	input.value = "";
}

function findLastMovie(movies){
	return movies[movies.length-1];
}

function findSecondLastMovie(movies){
	return movies[movies.length-2];
}


function textGenerator(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function integerGenerator(){
	return Math.floor(Math.random() * 11);
}

function createRandomReview(movie, user){
	newReview = 
			{
				user_id: user['_id'], // will need sessions for this
				message: textGenerator(40),
				movie_name: movie.Title,
				date: generateDate(),
				basic_review: integerGenerator(),
				user: user
			}

	return newReview;
}

function newUserContainsSpecChars(newMember){

	var pattern = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
    if (pattern.test(newMember['alias']) || newMember['alias'].indexOf(" ") >= 0) {
        return true;
    }

    return false;

	// return newMember['alias'].indexOf(' ') >= 0;
}

function canUnfollow(user, req){
	if(req.session.user == undefined){
		return false;
	}

	if(user.alias == req.session.user['alias']){
		return true;
	}

	return false;
}

exports.findSecondLastMovie = findSecondLastMovie;
exports.canUnfollow = canUnfollow;
exports.newUserContainsSpecChars = newUserContainsSpecChars;
exports.createRandomReview = createRandomReview;
exports.findLastMovie = findLastMovie;
exports.isValidResetLink = isValidResetLink;
exports.mergeMovieObjects = mergeMovieObjects;
exports.findReviewedMovies = findReviewedMovies;
exports.getAvailableGenres = getAvailableGenres;
exports.findCast = findCast;
exports.addPeopleToDatabase = addPeopleToDatabase;
exports.actorExistsInMovie = actorExistsInMovie;
exports.writerExistsInMovie = writerExistsInMovie;
exports.directorExistsInMovie = directorExistsInMovie;
exports.getEditMovieError = getEditMovieError;
exports.resetEditMovieError = resetEditMovieError;
exports.getFilmography = getFilmography;
exports.getLastTen = getLastTen;
exports.createResetLink = createResetLink;
exports.sendEmail = sendEmail;
exports.createResetEmail = createResetEmail;
exports.resetIsValid = resetIsValid;
exports.getResetPasswordErrors = getResetPasswordErrors;
exports.resetResetPasswordErrors = resetResetPasswordErrors;
exports.removeSecretInfo = removeSecretInfo;
exports.setMovieAPI = setMovieAPI;
exports.resetLoginError = resetLoginError;
exports.getLoginError = getLoginError;
exports.getFrequentCollaborators = getFrequentCollaborators;
exports.addPerson = addPerson;
exports.personExists = personExists;
exports.getAddPeopleErrors = getAddPeopleErrors;
exports.resetAddPeopleErrors = resetAddPeopleErrors;
exports.getAddMovieErrors = getAddMovieErrors;
exports.resetAddMovieErrors = resetAddMovieErrors;
exports.createMovie = createMovie;
exports.movieExists = movieExists;
exports.addMovie = addMovie;
exports.isAuthorized = isAuthorized;
exports.sendSuccess = sendSuccess;
exports.changeUser = changeUser;
exports.getUser = getUser;
exports.populateUser = populateUser;
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.dataIsFilled = dataIsFilled;
exports.userExists = userExists;
exports.authenticate = authenticate;
exports.isContributor = isContributor;
exports.canEdit = canEdit;
exports.canFollow = canFollow;
exports.getAllFollowers = getAllFollowers;
exports.unfollowUser = unfollowUser;
exports.getAllFollowing = getAllFollowing;
exports.changeFollowingStatus = changeFollowingStatus;
exports.followStatus = followStatus;
exports.changeFollowerStatus = changeFollowerStatus;
exports.removeFollowing = removeFollowing;
exports.addReview = addReview;
exports.createReview = createReview;
exports.canCreateReview = canCreateReview;
exports.getMovie = getMovie;
exports.splitMovieObject = splitMovieObject;
exports.movieGenresToList = movieGenresToList;
exports.peopleToArray = peopleToArray;
exports.inverseParam = inverseParam;
exports.genreIntersection = genreIntersection;
exports.resetErrors = resetErrors;
exports.getErrors = getErrors;
exports.getFollowers = getFollowers;
exports.getFollowing = getFollowing;
exports.getId = getId;
exports.findReviews = findReviews;
exports.getReviewErrors = getReviewErrors;
exports.resetReviewErrors = resetReviewErrors;
exports.getNewUserErrors = getNewUserErrors;
exports.resetNewUserErrors = resetNewUserErrors;