const express 			= require('express');
const path 			= require('path');
const mongoose 			= require('mongoose');
const session 			= require('express-session');
const MongoStore 		= require('connect-mongo')(session);
const movieTrailer 		= require('movie-trailer');
var	  ObjectId 		= require('mongodb').ObjectID;
const controller 		= require('./public/js/controller.js');
const email			= require('./public/procedures/email.js');
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/the-movie-database', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
let db = mongoose.connection;


db.once('open', function(){
	console.log("Connected to Database");
});

// uuid
const { v4: uuidv4 } = require('uuid');

// models
let Movies = require('./models/movies.js');
let Users = require('./models/users.js');
let People = require('./models/people.js');
let ResetPassword = require('./models/reset-password.js');



//Set static folder
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());

// load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


//body parser
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//sessions
app.use(session({
	secret: 'mysecret',
	resave: false,
	saveUninitialized: false,
	store: new MongoStore({mongooseConnection: mongoose.connection}),
	cookie: {maxAge: 180 * 60 * 1800}
}))


app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

app.post("/logout", function(req, res){
	req.session.loggedin = false;
	// req.session.destroy();
	res.redirect("/");
	return;
});

app.post('/login', function(req, res){
	if(req.session.loggedin){
		res.redirect("/");
		return;
	}

	let username = req.body.username;
	let password = req.body.password;
  
	Users.findOne({alias: {$regex : new RegExp("^" + username, "i")}, password: password}, function(err, user){
		if(user == null){
			req.session.loginError = -1;
			res.redirect("/");
			return;
		}

		req.session.loginError = 1;

		req.session.loggedin = true;

		req.session.user = user;

		// edit profile errors
		req.session.userExists 			= 0;
		req.session.invalidColor 		= 0;
		req.session.invalidPassword 	= 0;
		req.session.userTypeChanged 	= 0;
		req.session.signInError			= 0;

		// add movie errors
		req.session.movieExists 		= 0;
		req.session.fieldError 			= 0;
		req.session.addMovieContributorError = 0;

		// person exists errors
		req.session.personExists 		= 0;
		req.session.contributorError    = 0;
		req.session.fillMoreError		= 0;

		// review error
		req.session.reviewError 		= 0;
		req.session.invalidBasicReview 	= 0;

		// reset password errors
		req.session.resetPasswordError  = 0;
		req.session.updatePasswordError = 0;

		// edit movie error
		req.session.editMovieError = 0;
		req.session.personExistsError = 0;

		// add user errors
		req.session.spacesInUsernameError = 0;

		req.session.numMovies = 0;

		res.redirect('/');
		return;

	});
});

// Home Route
app.get('/', function(req, res){
	updateSession(req);
	// addAllPeople();
	// addAllReviews();
	Movies.find({}, function(err, movies){
		lastTen = controller.getLastTen(movies);
		controller.getLoginError(req);
		controller.resetLoginError(req);
		res.render('home', {lastTen});
	});
});



// all movies
app.get('/movies', function(req, res){
	updateSession(req);

	Movies.find({}, function(err, movies){
		if(!err){
			movieObjects = controller.splitMovieObject(movies);
			columnOne = movieObjects['moviesInColumnOne'];
			columnTwo = movieObjects['moviesInColumnTwo'];
			
			// console.log(JSON.stringify(req.headers));
			
			res.format(
				{
				'application/json':function(){
					controller.setMovieAPI(req);
					Movies.find(
						{$and:   
						[
							{Title: {$regex : new RegExp("^" + req.query['title'], "i")}}, 
						  	{Genre: {$regex : new RegExp("^" + req.query['genre'], "i")}}, 
						  	{Year: {$regex : new RegExp("^" + req.query['year'], "i")}},
						  	{Rating: {$gte: Number(req.query['minrating'])}}
						]
						},

					function(err, movies){
						if(movies.length != 0){
							res.set('Content-Type', 'application/json').status(200).send(movies);
							return;
						}else{
							res.set('Content-Type', 'application/json').status(404).send('no such movie(s) found');
							return;
						}
					});

				},

				'text/html':function(){
					if(req.query['advanced-search'] != undefined){
						Movies.find(
							{$and:   
							[
								{Title: {$regex : new RegExp("^" + req.query['title'], "i")}}, 
							  	{Genre: {$regex : new RegExp("^" + req.query['genre'], "i")}}, 
							  	{Year: {$regex : new RegExp("^" + req.query['year'], "i")}}
							  	// {Rating: {$gte: req.query['rating']}}
							]
							},

						function(err, movies){
							movieObjects = controller.splitMovieObject(movies);
							columnOne = movieObjects['moviesInColumnOne'];
							columnTwo = movieObjects['moviesInColumnTwo'];
							res.render('movies', {columnOne, columnTwo, req});
							return;
						});
					}else{
						if(req.query['genre'] != undefined){
							Movies.find({$or: 	

							[{Genre: {$regex : new RegExp("^" + req.query['genre'], "i")}}, 
							{Genre: {$regex : new RegExp(req.query['genre'].replace(/\s+/g,"\\s+"), "gi")}}]}, 

							function(err, movies){
								movieObjects = controller.splitMovieObject(movies);
								columnOne = movieObjects['moviesInColumnOne'];
								columnTwo = movieObjects['moviesInColumnTwo'];
								res.render('movies', {columnOne, columnTwo, req});
								return;
							});

						}else{
							res.render('movies', {columnOne, columnTwo, req});
							return;
						}
					}
				},

				'default':function(){
					res.status(406).send("Not Accepted.");
					return;
				}
			});
		}
	})
});


app.get('/movies/advanced-search', function(req, res){
	res.render('advanced-search');
	return;
});

// query param redirect
app.get('/movies/add-movie', function(req, res){
	res.redirect('/add-movie');
	return;
});

// movie page
app.get('/movies/:movie', function(req, res){
	updateSession(req);
	var url = req.originalUrl.split("/");

	Movies.find({}, function(err, movies){

		movie = controller.getMovie(req.params.movie, movies);

		if(movie == null){
			res.format(
			{
				'application/json':function(){
					res.set('Content-Type', 'application/json').status(404).send("movie not found");
					return;
				},
				'text/html':function(){
					res.render('movie-not-found');
					return;
				},
			});
		}else{
			movieTrailer(movie["Title"], {year: movie['Year'], id: true} ,(error, video_id) => {
				res.format(
				{
					'application/json':function(){
						res.set('Content-Type', 'application/json').status(200).send(movie);
						return;
					},
					'text/html':function(){
						genres = controller.movieGenresToList(movie);
						controller.removeGenreWhiteSpace(genres);
						controller.getEditMovieError(req);
						controller.resetEditMovieError(req);
						avg = Math.round(movie.sumOfRatings / movie.Reviews.length * 10) / 10;
						res.render('movie', {url, movie, genres, video_id, req, avg});
						return;
					},
					'default':function(){
						res.status(406).send("Not Accepted.");
						return;
					}
				});
			});
		}
	}).lean();

});



// edit movie
app.get('/movies/:movie/edit-movie', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");

	if(!req.session.loggedin){
		res.render('contributor-error');
	}

	Movies.find({}, function(err, movies){
		People.find({}, function(err, people){
			movie = controller.getMovie(req.params.movie, movies);
			if(movie != null){
				var splitPeople = controller.peopleToArray(people, movie);
				var availableGenres = controller.getAvailableGenres(movie);
				res.render('edit-movie', {url, splitPeople, movie, availableGenres});
				return;
			}else{
				res.render('/404');
				return;
			}
		});
	}).lean();
});


// edit movie
app.post('/movies/:movie', function(req, res){
	var url = req.originalUrl.split("/");
	var title = controller.inverseParam(req.params.movie);
	var newActor = req.body.actors;
	var newWriter = req.body.writers;
	var newDirector = req.body.directors;
	var query = {Title: {$regex : new RegExp("^" + title, "i")}};
	updateSession(req);

	if(req.session.user['type'] != "Contributor"){
		req.session.editMovieError = -1; // contributor error
		res.redirect(url.join("/"));
		return;
	}

	Movies.find(query, function(err, movie){
		if(req.body.actors != ""){
			if(!controller.actorExistsInMovie(movie[0], newActor)){
				Movies.updateOne(query, {$set: {Actors:movie[0]['Actors'] + ", " + newActor}}, function(err, docs){
					if(err){
						res.render('error');
					}
				});
			}else{
				req.session.personExistsError = -1;
				res.redirect(url.join("/"));
				return;
			}
		}
		if(req.body.writers != ""){
			if(!controller.writerExistsInMove(movie[0], newWriter)){
				Movies.updateOne(query, {$set: {Writer:movie[0]['Writer'] + ", " + newWriter}}, function(err, docs){
					if(err){
						res.render('error');
					}
				});
			}else{
				req.session.personExistsError = -1;
				res.redirect(url.join("/"));
				return;
			}
		}

		if(req.body.directors != ""){
			if(!controller.directorExistsInMovie(movie[0], newDirector)){
				Movies.updateOne(query, {$set: {Director:movie[0]['Director'] + ", " + newDirector}}, function(err, docs){
					if(err){
						res.render('error');
					}
				});
			}else{
				req.session.personExistsError = -1;
				res.redirect(url.join("/"));
				return;
			}
		}

		if(req.body.genres != ""){
			Movies.updateOne(query, {$set: {Genre:movie[0]['Genre'] + ", " + req.body.genres}}, function(err, docs){
				if(err){
					res.render('error');
				}
			});
		}

		People.find({firstName: {$regex : new RegExp("^" + newActor.split(" ")[0], "i")}, lastName: {$regex : new RegExp("^" + newActor.split(" ")[1], "i")}}, function(err, actor){
			People.find({firstName: {$regex : new RegExp("^" + newWriter.split(" ")[0], "i")}, lastName: {$regex : new RegExp("^" + newWriter.split(" ")[1], "i")}}, function(err, writer){
				People.find({firstName: {$regex : new RegExp("^" + newDirector.split(" ")[0], "i")}, lastName: {$regex : new RegExp("^" + newDirector.split(" ")[1], "i")}}, function(err, director){
					Users.find({}, function(err, users){
						notifiedUsers = controller.getAllEditMovieNotifiedUsers(users, actor, writer, director);
						notifications = controller.makeEditMovieNotifications(notifiedUsers, movie, actor, writer, director);

						for(let i = 0; i<notifications.length; i++){
							var querySession = {alias: {$regex : new RegExp("^" + notifications[i]['alias'], "i")}};
							Users.updateOne(querySession, {$push: {notifications:notifications[i]}}, function(err, docs){
							});
						}

						Users.find({alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}}, function(err, user){
							req.session.user['notifications'] = user[0]['notifications'];
							if(req.body.actors != "" || req.body.writers != "" || req.body.directors != ""){
								req.session.editMovieError = 1;
							}
							res.redirect(url.join("/"));
							return;
						})
					});
				});
			});
		});
	});
});

// cast and crew of movie
app.get('/movies/:movie/cast-crew', function(req, res){
	updateSession(req);
	
	var url = req.originalUrl.split("/");
	var url = req.originalUrl.split("/");
	var title = controller.inverseParam(req.params.movie);

	Movies.find({Title: {$regex : new RegExp(title, "i")}}, function(err, movie){
		People.find({}, function(err, people){
			cast = controller.findCast(movie, people);
			res.render('cast-crew', {url, movie, cast});
			return;
		});
	});
});

// movie reviews
app.get('/movies/:movie/reviews', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var title = controller.inverseParam(req.params.movie);

	Movies.find({Title: {$regex : new RegExp("^" + title, "i")}}, function(err, movie){
		if(Object.entries(movie).length != 0){
			reviews = movie[0]['Reviews'];
			movie = movie[0];
			controller.getReviewErrors(req);
			controller.resetReviewErrors(req);
			res.render('movie-reviews', {url, movie, reviews});
			return;
		}else{
			res.render('404');
			return;
		}
	}).lean();
});


// create movie review
app.post('/movies/:movie/reviews', function(req, res){
	var url = req.originalUrl.split("/");
	var title = controller.inverseParam(req.params.movie);

	if(req.session.loggedin){
		Movies.find({Title: {$regex : new RegExp("^" + title, "i")}}, function(err, movie){
			if(controller.canCreateReview(req)){
				req.session.reviewError = 1;

				var newReview = controller.createReview(req, movie[0]['Title']);

				Movies.updateOne({Title: {$regex : new RegExp("^" + title, "i")}},{$push: {Reviews: newReview}}, function(err, docs){
					if(err){
						res.redirect('error');
						return;
					}else{
						res.redirect(url.join("/"));
						return;
					}
				});

				// increment number of reviews users has
				Users.findOneAndUpdate({alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}}, {$inc : {reviews_submitted: 1}}, function(err, docs){});

				// increments sum of rating for avg
				Movies.findOneAndUpdate({Title: {$regex : new RegExp("^" + title, "i")}}, {$inc : {sumOfRatings: Number(req.body.basic_review)}}, function(err, docs){});

				// update avg
				var average = ((movie[0]['sumOfRatings']+Number(req.body.basic_review))/(movie[0]['Reviews'].length+1)).toFixed(2);

				Movies.findOneAndUpdate({Title: {$regex : new RegExp("^" + title, "i")}}, {Rating: average}, function(err, docs){
				});


				// update review notif
				Users.find({}, function(err, users){
					followers = controller.getFollowers(users, req.session.user['_id']);
					notification = controller.getNewReviewNotification(req, movie);

					for(let i = 0; i<followers.length; i++){
						var querySession = {alias: {$regex : new RegExp("^" + followers[i]['alias'], "i")}};
						Users.updateOne(querySession, {$push: {notifications:notification}}, function(err, docs){});
					}
				});
			}else{
				req.session.reviewError = -1;
				res.redirect(url.join("/"));
				return;
			}
		}).lean();
	}else{
		req.session.reviewLoginError = -1;
		res.redirect(url.join("/"));
		return;
	}
});


// related movies
app.get('/movies/:movie/related', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var title = controller.inverseParam(req.params.movie);

	Movies.find({Title: {$regex : new RegExp("^" + title, "i")}}, function(err, movie){
		if(Object.entries(movie).length != 0){
			genres = controller.movieGenresToList(movie[0]);
			Movies.find({}, function(err, movies){
				relatedMovies = controller.genreIntersection(movies, genres);
				relatedMovies = controller.splitMovieObject(relatedMovies);
				columnOne = relatedMovies['moviesInColumnOne'];
				columnTwo = relatedMovies['moviesInColumnTwo'];

				res.render('related-films', {url, movie, columnOne, columnTwo});
				return;
			});
		}else{
			res.render('no-related-movies', {url, movie});
			return;
		}
	});
});


// user page
app.get('/users', function(req, res){
	updateSession(req);

	Users.find({}, function(err, users){

		res.format(
		{
			'application/json':function(){
				username = "";
				if(req.query['username'] != undefined){
					username = req.query['username'];
				}

				Users.find({alias: {$regex : new RegExp("^" + username, "i")}}, function(err, user){
					if(user.length != 0){
						res.set('Content-Type', 'application/json').status(200).send(user);
						return;
					}else{
						res.set('Content-Type', 'application/json').status(404).send('user not found');
					}
				});
			},
			'text/html':function(){
				res.render('users',{users});
				return;
			},
			'default':function(){
				res.status(406).send("Not Accepted.");
				return;
			}
		});
	});
});


// add user
app.post('/users', function(req, res){
	res.redirect('users');
});


// add movie page
app.get('/add-movie', function(req, res){
	updateSession(req);

	if(!req.session.loggedin){
		res.render("logged-in-error");
		return;
	}

	People.find({}, function(err, people){
		var splitPeople = controller.peopleToArray(people, "");
		controller.getAddMovieErrors(req);
		controller.resetAddMovieErrors(req);

		Movies.find({}, function(err, movies){
			lastMovie = controller.findLastMovie(movies);
			secondLastMovie = controller.findSecondLastMovie(movies);
			if(lastMovie.Title == secondLastMovie.Title){
				Movies.deleteOne({ _id: ObjectId(lastMovie['_id']) }, function(err, result) {
				}).lean();
			}
		});

		res.render('add-movie', {req, splitPeople});
		return;
	});
});

const movieArt = require('movie-art');

// add movie
app.post('/movies', function(req, res){
	// req.setTimeout(0)
	// console.log(res.headersSent);
	res.format(
	{
		'application/json':function(){
			Movies.find({}, function(err, movies){
				if(controller.movieExists(movies, req.body.Title)){
					res.status(400).send("Error: A Movie with that name already Exists");
					return;
				}

				movieArt(req.body.Title, (error, response) => {
					newMovie = controller.createMovie(req.body, response);

					if(String(newMovie['Poster']).includes('Error: No results found')){
						newMovie['Poster'] = '/images/new-movie-image-not-found.jpg';
					}

					Movies.insertMany(newMovie, function(err, docs){
						actorFirstName = req.body.Actors.split(" ")[0];
						actorLastName = req.body.Actors.split(" ")[1];

						writerFirstName = req.body.Writer.split(" ")[0];
						writerLastName = req.body.Writer.split(" ")[1];

						directorFirstName = req.body.Director.split(" ")[0];
						directorLastName = req.body.Director.split(" ")[1];

						People.find({firstName: {$regex : new RegExp("^" + actorFirstName, "i")}, lastName: {$regex : new RegExp("^" + actorLastName, "i")}}, function(err, actor){
							People.find({firstName: {$regex : new RegExp("^" + writerFirstName, "i")}, lastName: {$regex : new RegExp("^" + writerLastName, "i")}}, function(err, writer){
								People.find({firstName: {$regex : new RegExp("^" + directorFirstName, "i")}, lastName: {$regex : new RegExp("^" + directorLastName, "i")}}, function(err, director){
									if(actor.length == 0){
										req.body.firstName = req.body.Actors.split(" ")[0];
										req.body.lastName = req.body.Actors.split(" ")[1];
										req.body.country = req.body.Country;
										req.body.type = "Actor"
										
										newPerson = controller.addPerson(req);
										People.insertMany(newPerson, function(err, docs){});
									}

									if(writer.length == 0){
										req.body.firstName = req.body.Writer.split(" ")[0];
										req.body.lastName = req.body.Writer.split(" ")[1];
										req.body.country = req.body.Country;
										req.body.type = "Writer";

										newPerson = controller.addPerson(req);
										People.insertMany(newPerson, function(err, docs){});
									}

									if(director.length == 0){
										req.body.firstName = req.body.Director.split(" ")[0];
										req.body.lastName = req.body.Director.split(" ")[1];
										req.body.country = req.body.Country;
										req.body.type = "Director";

										newPerson = controller.addPerson(req);
										People.insertMany(newPerson, function(err, docs){});
									}
									res.status(200).send("Success");
									return;

								});
							});
						});
					});
				})
			});
		},
		'text/html':function(){
			if(req.session.user['type'] == "Contributor" && req.session.loggedin){
				Movies.find({}, function(err, movies){
					if(controller.movieExists(movies, req.body.Title)){
						req.session.movieExists = -1;
						res.redirect('/add-movie');
						return;
					}

					movieArt(req.body.Title, {year: req.body.Year}, (error, response) => {
						newMovie = controller.createMovie(req.body, response);
						// console.log(String(newMovie['Poster']).includes('Error: No results found'));
						if(String(newMovie['Poster']).includes('Error: No results found')){
							newMovie['Poster'] = '/images/new-movie-image-not-found.jpg';
						}

						Movies.insertMany(newMovie, function(err, docs){
							if(err != null){ // if not successful
								if(!res.headersSent){
									req.session.fieldError = -1;
									res.redirect('/add-movie');
									return;
								}else{
									return;
								}
							}else{
								req.session.fieldError = 1;
							}

							actorFirstName = req.body.Actors.split(" ")[0];
							actorLastName = req.body.Actors.split(" ")[1];

							writerFirstName = req.body.Writer.split(" ")[0];
							writerLastName = req.body.Writer.split(" ")[1];

							directorFirstName = req.body.Director.split(" ")[0];
							directorLastName = req.body.Director.split(" ")[1];

							People.find({firstName: {$regex : new RegExp("^" + actorFirstName, "i")}, lastName: {$regex : new RegExp("^" + actorLastName, "i")}}, function(err, actor){
								People.find({firstName: {$regex : new RegExp("^" + writerFirstName, "i")}, lastName: {$regex : new RegExp("^" + writerLastName, "i")}}, function(err, writer){
									People.find({firstName: {$regex : new RegExp("^" + directorFirstName, "i")}, lastName: {$regex : new RegExp("^" + directorLastName, "i")}}, function(err, director){

										Users.find({}, function(err, users){

											Movies.find({}, function(err, movies){
												// secondlastMovie = controller.findLastMovie(movies);
												// console.log(secondlastMovie.Title == req.body.Title);
												notifiedUsers = controller.getAllNotifiedUsers(users, actor, writer, director);
												notifications = controller.makeNotifications(notifiedUsers, req, actor, writer, director);

												for(let i = 0; i<notifications.length; i++){
													var querySession = {alias: {$regex : new RegExp("^" + notifications[i]['alias'], "i")}};
													Users.updateOne(querySession, {$push: {notifications:notifications[i]}}, function(err, docs){});
												}
												
											
												Users.find({alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}}, function(err, user){
													req.session.user['notifications'] = user[0]['notifications'];
												
													if(!res.headersSent){
														res.redirect("/add-movie");
														return;
													}else{
														return;
													}
												});
											});
										});
									});
								});
							});
						});
					});
				});
			}else{
				req.session.addMovieContributorError = -1;
				res.redirect("/add-movie");
				return;
			}
		}
	});
});


// all people
app.get('/people', function(req, res){
	updateSession(req);

	People.find({}, function(err, people){
		controller.getAddPeopleErrors(req);
		controller.resetAddPeopleErrors(req);

		res.format(
		{
			'application/json':function(){
				firstName = lastName = "";
				if(req.query['name'] != undefined){
					firstName = req.query['name'].split("$")[0];
					lastName = req.query['name'].split("$")[1];
				}

				if(lastName != undefined){
					url = "~" + firstName.toLowerCase() + "-" + lastName.toLowerCase();
					People.find({url_name:{$regex : new RegExp("^" + url, "i")}}, function(err, person){
						if(person.length != 0){
							res.set('Content-Type', 'application/json').status(200).send(person);
							return;
						}else{
							res.set('Content-Type', 'application/json').status(404).send('person not found');
						}
					});
				}else{
					People.find({$or:[{firstName: {$regex : new RegExp("^" + firstName, "i")}}, {lastName: {$regex : new RegExp("^" + lastName, "i")}}]}, function(err, person){
						if(person.length != 0){
							res.set('Content-Type', 'application/json').status(200).send(person);
							return;
						}else{
							res.set('Content-Type', 'application/json').status(404).send('person not found');
						}
					});
				}
			},
				'text/html':function(){
					res.render('people', {people, req});
					return;
				},
				'default':function(){
					res.status(406).send("Not Accepted.");
					return;
			}
		});
	});
});

// add people page
app.get('/add-person', function(req, res){
	updateSession(req);

	if(!req.session.loggedin){
		res.render("logged-in-error");
		return;
	}

	res.render('add-person');
});

// add actor/director/writer AKA add person
app.post('/add-person', function(req, res){

	if(!req.session.loggedin){
		res.redirect("logged-in-error");
		return;
	}

	if(req.session.user['type'] != "Contributor"){
		req.session.contributorError = -1;
		res.redirect('./people');
		return;
	}

	People.find({}, function(err, people){
		if(!controller.personExists(req, people)){
			newPerson = controller.addPerson(req, people);
			People.insertMany(newPerson, function(err, docs){
				if(err != null){
					req.session.fillMoreError = -1;
				}else{
					req.session.fillMoreError = 1;
				}
				req.session.personExists = 1;
				res.redirect('/people');
				return;
			});
		}else{
			req.session.personExists = -1;
			res.redirect('/people');
			return;
		}
	});
});

// person profile
app.get('/people/:person', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var name = controller.inverseParam(req.params.person).slice(1);
	name = name.split(" ");

	People.find({firstName: {$regex : new RegExp("^" + name[0], "i")}, lastName: {$regex : new RegExp("^" + name[1], "i")}}, function(err, person){
		if(person.length != 0){
			person = person[0];
			followStatus = controller.followStatus(req.session, person);

			res.format(
			{
				'application/json':function(){
					var name = controller.inverseParam(req.params.person).slice(1);
					Movies.find({Actors: {$regex : new RegExp(name, "i")}}, function(err, movies){
						person['movies'] = movies;
						res.set('Content-Type', 'application/json').status(200).send(person);
						return;
					}).lean();
				},

				'text/html':function(){
					res.render('person-profile', {url, person});
					return;
				},

				'default':function(){
					res.status(406).send("Not Accepted.");
					return;
				}
				
			});


		}else{
			res.format(
			{
				'application/json':function(){
					res.set('Content-Type', 'application/json').status(404).send("person not found");
					return;
				},
				'text/html':function(){
					res.render('person-not-found');
					return;
				}
			});
		}
	}).lean();
});

// person follow or unfollow button
app.post('/people/:person/follow', function(req, res){
	var url = req.originalUrl.split("/");
	var name = controller.inverseParam(req.params.person).slice(1);
	name = name.split(" ");

	if(req.session.loggedin){
		var querySession = {alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}};
		var queryUserPage = {firstName: {$regex : new RegExp("^" + name[0], "i")}, lastName: {$regex : new RegExp("^" + name[1], "i")}};
		People.find({firstName: {$regex : new RegExp("^" + name[0], "i")}, lastName: {$regex : new RegExp("^" + name[1], "i")}}, function(err, person){
			controller.changeFollowingStatus(req.session, person);
			controller.changeFollowerStatus(req.session, person);

			Users.updateOne(querySession, {$set: {following:req.session.user['following']}}, function(err, docs){});

			People.updateOne(queryUserPage, {$set: {followers:person[0]['followers']}}, function(err, docs){});
			
			res.redirect(url.slice(0,-1).join("/"));
		});
	}else{
		res.redirect(url.slice(0,-1).join("/"));
	}
});


app.get('/people/:person/filmography', function(req, res){

	var url = req.originalUrl.split("/");
	var name = controller.inverseParam(req.params.person).slice(1);
	splitPerson = name.split(" ");

	People.find({firstName: {$regex : new RegExp("^" + splitPerson[0], "i")}, lastName: {$regex : new RegExp("^" + splitPerson[1], "i")}}, function(err, person){
		person = person[0];

		Movies.find({}, function(err, movies){

			if(Object.entries(movies).length != 0){
				genres = controller.movieGenresToList(movies[0]);
				relatedMovies = controller.getFilmography(movies, person);

				relatedMovies = controller.splitMovieObject(relatedMovies);
				columnOne = relatedMovies['moviesInColumnOne'];
				columnTwo = relatedMovies['moviesInColumnTwo'];

				res.render('filmography', {url, person, columnOne, columnTwo});
				return;
			}else{
				res.render('filmography', {url, person});
				return;
			}
		});
	});
})

app.get('/people/:person/frequent-collaborators', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var name = controller.inverseParam(req.params.person).slice(1);
	splitPerson = name.split(" ");

	People.find({firstName: {$regex : new RegExp("^" + splitPerson[0], "i")}, lastName: {$regex : new RegExp("^" + splitPerson[1], "i")}}, function(err, person){
		person = person[0];
		Movies.find({}, function(err, movies){
			People.find({}, function(err, people){
				collaborators = controller.getFrequentCollaborators(movies, people, name);

				res.render('frequent-collaborators', {url, collaborators, person, people});
				return;
			}).lean();
		}).lean();
	});
})


app.get('/help', function(req, res){
	updateSession(req);

	controller.getResetPasswordErrors(req);
	controller.resetResetPasswordErrors(req);
	res.render('help', {req});
});


app.get('/join', function(req, res){
	updateSession(req);

	controller.getNewUserErrors(req);
	controller.resetNewUserErrors(req);
	res.render('join');
	return;
});


app.post('/join', function(req, res){
	updateSession(req);

	const newMember = controller.populateUser(req);
	if(controller.newUserContainsSpecChars(newMember)){
		req.session.spacesInUsernameError = -1;
		res.redirect('./join');
		return;
	}else{
		Users.find({}, function(err, users){
			if(!controller.userExists(req, users)){
				Users.insertMany(newMember, function(err, docs){

					if(err != null){
						req.session.newUserInvalidInputError = -1;
					}
					req.session.newUserExistsError = 1;
					res.redirect('/join');
					return;
				});
			}else{
				req.session.newUserExistsError = -1;
				res.redirect('/join');
				return;
			}
		});
	}
});



// user profile
app.get('/users/:user', function(req, res){
	updateSession(req);
	
	res.format(
	{
		'application/json':function(){
			Movies.find({}, function(err, movies){
				var alias = controller.inverseParam(req.params.user).slice(1);
				Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, userJSON){
					if(userJSON.length == 0){
						res.set('Content-Type', 'application/json').status(404).send("That user does not exist");
						return;
					}else{
						reviews = controller.findReviews(movies, userJSON['_id']);
						userJSON = userJSON[0];
						delete userJSON['notifications'];
						userJSON['Reviews'] = reviews; 
						res.set('Content-Type', 'application/json').status(200).send(userJSON);
						return;
					}
				}).lean();

			}).lean();
		},
		'text/html':function(){
			var url = req.originalUrl.split("/");
			var alias = controller.inverseParam(req.params.user).slice(1);

			Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, userObject){
				if(Object.entries(userObject).length != 0){
					user = userObject[0];
					canEdit = controller.canEdit(user, alias, req);
					canFollow = controller.canFollow(req.session, alias);
					followStatus = controller.followStatus(req.session, user);
					controller.getErrors(req);
					controller.resetErrors(req);

					res.render('user-profile', {user, canEdit, url, canFollow, followStatus, req});
					return;
				}else{
					res.render('user-not-found');
					return;
				}
			}).lean();
		},
		'default':function(){
			res.status(406).send("Not Accepted.");
			return;
		}
	});
});


// edit profile page
app.get('/users/:user/edit-profile', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);

	Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
		if(Object.entries(user).length != 0){
			user = user[0];
			controller.authenticate(user, user);
			res.render('edit-profile', {user, url});
			return;
		}else{
			res.render("404");
			return;
		}
	});
});


// edit profile
app.post('/users/:user', function(req, res){
	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);
	var query = {alias: {$regex : new RegExp("^" + alias, "i")}};

	if(!req.session.loggedin){
		req.session.signInError = -1;
		res.redirect(url.join("/"));
		return;
	}

	if(req.body.password === req.session.user['password']){	
		Users.find({}, function(err, users){
			controller.isAuthorized(req, users, controller.getUser(users, alias), req);

			Users.updateOne(query, {$set: {
				alias: req.session.user['alias'], 
				color: req.session.user['color'], 
				url_name: req.session.user['url_name']},
				type: req.session.user['type']
			}, function(err, docs){
				res.redirect(url.slice(0,-1).join("/") + "/" + req.session.user['url_name']);
				return;
			});
		});
	}else{
		controller.resetErrors(req);
		req.session.invalidPassword = -1;
		res.redirect(url.slice(0,-1).join("/") + "/" + req.session.user['url_name']);
		return;
	}
});

// user followers
app.get('/users/:user/followers', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);

	Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
		Users.find({}, function(err, users){
			if(Object.entries(user).length != 0){
				user = user[0];
				followers = controller.getFollowers(users, user['_id']);
				
				res.render('followers', {url, user, followers, req});
				return;
			}
		});
	});
});


// user following
app.get('/users/:user/following', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);

	Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
		People.find({}, function(err, people){
			Users.find({}, function(err, users){
				if(Object.entries(user).length != 0){
					user = user[0];
					userFollowing = controller.getFollowing(users, user['_id']); // users
					peopleFollowing = controller.getPeopleFollowing(people, user['_id']); // people
					following = userFollowing.concat(peopleFollowing);
					canUnfollow = controller.canUnfollow(user, req);
					res.render('following', {url, user, following, req, canUnfollow});
					return;
				}
			});
		});
	});
});


// user follow or unfollow button
app.post('/users/:user/follow', function(req, res){

	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);

	if(req.session.loggedin){
		var querySession = {alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}};
		var queryUserPage = {alias: {$regex : new RegExp("^" + alias, "i")}};
		Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
			controller.changeFollowingStatus(req.session, user);
			controller.changeFollowerStatus(req.session, user);

			Users.updateOne(querySession, {$set: {following:req.session.user['following']}}, function(err, docs){});

			Users.updateOne(queryUserPage, {$set: {followers:user[0]['followers']}}, function(err, docs){});

			notification = controller.makeFollowNotification(req, user);

			if(req.body.status == "Follow"){
				Users.updateOne(queryUserPage, {$push: {notifications:notification}}, function(err, docs){
				});
			}
			res.redirect(url.slice(0,-1).join("/"));
			return;
		});
	}else{
		res.redirect(url.slice(0,-1).join("/"));
	}
});


// unfollow button in following list
app.post('/users/:user/following', function(req, res){
	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);
	var querySession = {alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}};
	if(req.session.loggedin){
		Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
			idToDelete = controller.getId(req.body.index, user[0]);

			if(req.body.type == "person"){
				People.find({_id: ObjectId(idToDelete)}, function(err, foundPerson){

					queryPerson = {_id : foundPerson[0]['_id']};

					controller.removeFollowing(req.session, foundPerson, idToDelete);

					Users.updateOne(querySession, {$set: {following:req.session.user['following']}}, function(err, docs){});

					People.updateOne(queryPerson, {$set: {followers:foundPerson[0]['followers']}}, function(err, docs){});

					res.redirect(url.join("/"));
				});
			}else{
				Users.find({_id: ObjectId(idToDelete)}, function(err, foundUser){
					queryUser = {_id : foundUser[0]['_id']};

					controller.removeFollowing(req.session, foundUser, idToDelete);

					Users.updateOne(querySession, {$set: {following:req.session.user['following']}}, function(err, docs){});

					Users.updateOne(queryUser, {$set: {followers:foundUser[0]['followers']}}, function(err, docs){});

					res.redirect(url.join("/"));
				});
			}
		});
	}else{
		res.redirect(url.join("/"));
	}
});


// EXTRA FEATURE MAY IMPLEMENT LATER
// app.get('/users/:user/saved-movies', function(req, res){
// 	var url = req.originalUrl.split("/");
// 	var alias = controller.inverseParam(req.params.user).slice(1);
	
// 	Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
// 		user = user[0];
// 		res.render('saved-movies', {url, user});
// 		return;
// 	});
// });

// user reviews
app.get('/users/:user/reviews', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	var alias = controller.inverseParam(req.params.user).slice(1);

	Movies.find({}, function(err, movies){
		Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
			user = user[0];
			reviews = controller.findReviews(movies, user['_id']);

			res.render('user-reviews', {url, user, reviews, req});
			return;
		});
	})

});

app.get('/users/:user/recommended', function(req, res){
	updateSession(req);

	if(req.params.user == req.session.user['url_name']){
		var url = req.originalUrl.split("/");
		var alias = controller.inverseParam(req.params.user).slice(1);

		Movies.find({}, function(err, movies){
			Users.find({alias: {$regex : new RegExp("^" + alias, "i")}}, function(err, user){
				People.find({}, function(err, people){
					Users.find({}, function(err, users){
						if(Object.entries(user).length != 0){
							user = user[0];
							peopleFollowing = controller.getPeopleFollowing(people, user['_id']); // people

							reviews = controller.findReviews(movies, user['_id']);
							moviesWithFollowedPeople = [];
							for(i = 0; i<peopleFollowing.length; i++){
								relatedMovies = controller.getFilmography(movies, peopleFollowing[i]);
								for(j = 0; j<relatedMovies.length; j++){
									moviesWithFollowedPeople.push(relatedMovies[j]);
								}
							}

							reviewedMovies = controller.findReviewedMovies(movies, reviews);
							recommendedMovies = controller.mergeMovieObjects(reviewedMovies, moviesWithFollowedPeople);

							recommendedMovies = controller.splitMovieObject(recommendedMovies);
							columnOne = recommendedMovies['moviesInColumnOne'];
							columnTwo = recommendedMovies['moviesInColumnTwo'];

							user = req.session.user;

							res.render('recommended', {url, columnOne, columnTwo, user});
							return;
						}
					});
				});
			});
		})
	}else{
		res.render('404');
		return;
	}
});

app.get('/notifications', function(req, res){
	updateSession(req);

	var url = req.originalUrl.split("/");
	if(req.session.loggedin){
		// var querySession = {alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}};

		Users.find({alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}}, function(err, user){
			user = user[0];

			res.render('notifications', {user, url});
			return;
		})
	}else{
		res.render('logged-in-error');
		return;
	}
});

app.post('/notifications', function(req, res){
	Users.find({alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}}, function(err, user){
		user = user[0];
		controller.removeNotification(user, req.body.index);
		var querySession = {alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}};
		Users.updateOne(querySession, {$set: {notifications:user['notifications']}}, function(err, docs){});
		req.session.user['notifications'] = user['notifications']; // update session
		res.redirect('/notifications');
	});
})

// request email
app.post("/help", function(req, res){
	Users.find({email: {$regex: new RegExp("^" + req.body.email, "i")}}, function(err, user){
		if(controller.resetIsValid(req, user)){
			var id = uuidv4();
			req.session.resetUserName = user[0]['alias'];
			req.session.resetPassword = user[0]['password'];
			controller.sendEmail(email, controller.createResetEmail(req, id));
			newResetLink = controller.createResetLink(user[0], id);
			ResetPassword.insertMany(newResetLink, function(err, docs){});
		}

		res.redirect('help');
		return;
	});
})

// reset password (email link)
app.get("/reset/:id", function(req, res){
	var url = req.originalUrl.split("/")[2];
	
	ResetPassword.find({}, function(err, resetLinks){
		if(controller.isValidResetLink(resetLinks, req.params)){
			res.render('reset-password', {url});
			return;
		}else{
			res.render('invalid-reset-link');
		}
	});

});

// update password
app.post("/reset", function(req, res){
	var url = req.originalUrl.split("/");
	ResetPassword.find({id: req.body.id}, function(err, resetLink){
		if(resetLink.length === 0){
			req.session.updatePasswordError = -2; // expired
			res.redirect('help');
			return;
		}

		Users.updateOne({email: resetLink[0]['email']}, {$set: {password:req.body.password}}, function(err, docs){
			if(err == null){
				req.session.updatePasswordError = 1;
				res.redirect('help');
				ResetPassword.deleteOne({id: req.body.id}, function(err, docs){});
				return;
			}else{
				req.session.updatePasswordError = -1
				res.redirect('help');
				return;
			}
		});
	});
});

app.get('/expired', function(req, res){
	res.render('expired');
	return;
})

app.get('*', function(req, res){
	updateSession(req);

	res.status(404).render('404');
});

app.get('/404', function(req, res){
	updateSession(req);
	res.render('404');
	return;
});

function updateSession(req){
	controller.removeSecretInfo(req);

	if(req.session.loggedin){

		Users.find({alias: {$regex : new RegExp("^" + req.session.user['alias'], "i")}}, function(err, user){
			user = user[0];
			req.session.user = user;
		});
	}
}

function addAllPeople(){

	Movies.find({}, function(err, movies){
		var people = controller.addPeopleToDatabase(movies);

		for(i = 0; i < people.length; i++){
			People.insertMany(people[i], function(err, docs){});	
		}
	});
}

function addAllReviews(){
	Users.find({}, function(err, users){
			Movies.find({}, function(err, movies){
				for(i = 0; i<users.length; i++){
					user = users[i];
					// console.log(user['alias']);
					delete user['notifications'];
					delete user['followers'];
					delete user['following'];
					delete user['password'];
					delete user['email'];
					delete user['saved-movies'];
					delete user['country'];

					for(j = 0; j<movies.length; j++){
						movie = movies[j];
						// console.log(movies[0]['Reviews']);
						review = controller.createRandomReview(movie, user);
						// console.log(review);

						Movies.updateOne({Title: {$regex : new RegExp("^" + movie.Title, "i")}},{$push: {Reviews: review}}, function(err, docs){
						});

						// increment number of reviews users has
						Users.findOneAndUpdate({alias: {$regex : new RegExp("^" + user['alias'], "i")}}, {$inc : {reviews_submitted: 1}}, function(err, docs){});

						// increments sum of rating for avg
						Movies.findOneAndUpdate({Title: {$regex : new RegExp("^" + movie.Title, "i")}}, {$inc : {sumOfRatings: Number(review.basic_review)}}, function(err, docs){});

						// update avg
						var average = ((movie['sumOfRatings']+Number(review.basic_review))/(movie['Reviews'].length+1)).toFixed(2);

						Movies.findOneAndUpdate({Title: {$regex : new RegExp("^" + movie.Title, "i")}}, {Rating: average}, function(err, docs){});
					}
				}
			}).lean();
	}).lean();
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Server started on port 3000'));
