var fs = require("fs");
var file = "data.db";
var exists = fs.existsSync(file);
var q = require("q")

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

db.serialize(function() {
    if(!exists) {
        setUpDatabase()
    }
});

function setUpDatabase(){
    db.run("CREATE TABLE Actor (id INTEGER PRIMARY KEY, adult INTEGER, biography TEXT, birthday TEXT, deathday TEXT, homepage TEXT, imdb_id TEXT, name TEXT, place_of_birth TEXT, popularity REAL, profile_path TEXT);");
    //db.run("CREATE TABLE Movie (id INTEGER PRIMARY KEY)");
    //db.run("CREATE TABLE TvShow (id INTEGER PRIMARY KEY)");
    db.run("CREATE TABLE PlaysInMovie (actorId INTEGER, movieId INTEGER, character TEXT);");
    db.run("CREATE TABLE PlaysInTvShow (actorId INTEGER, tvShowId INTEGER, character TEXT);");
    db.run("CREATE TABLE CrewInTvShow (actorId INTEGER, tvShowId INTEGER, job TEXT);");
    db.run("CREATE TABLE CrewInMovie (actorId INTEGER, movieId INTEGER, job TEXT);");
    //db.run("CREATE TABLE PlaysInMovie (FOREIGN KEY(actorId) REFERENCES Actor(id), FOREIGN KEY(movieId) REFERENCES Movie(id))");
    //db.run("CREATE TABLE PlaysInTvShow (FOREIGN KEY(actorId) REFERENCES Actor(id), FOREIGN KEY(tvShowId) REFERENCES TvShow(id))");
}

function updateToNewShema(){
    db.run("CREATE TABLE Movie (id INTEGER PRIMARY KEY, adult INTEGER, budget INTEGER, homepage TEXT, imdb_id TEXT, original_title TEXT, original_language TEXT, overview TEXT, popularity REAL, production_countries TEXT, release_date TEXT, revenue INTEGER, runtime INTEGER, spoken_languages TEXT, status TEXT, tagline TEXT, title TEXT, video INTEGER, vote_average REAL, vote_count INTEGER);");
    db.run("CREATE TABLE TvShow (id INTEGER PRIMARY KEY, first_air_date TEXT, homepage TEXT, in_production INTEGER, languages TEXT, last_air_date TEXT, name TEXT, networks TEXT, number_of_episodes INTEGER, number_of_seasons INTEGER, origin_country TEXT, original_language TEXT, original_name TEXT, overview TEXT, popularity REAL, status TEXT, type TEXT, vote_average REAL, vote_count INTEGER );");
    db.run("CREATE TABLE MovieToGenre (movieId INTEGER, genreId INTEGER);");
    db.run("CREATE TABLE TvShowToGenre (tvShowId INTEGER, genreId INTEGER);");
    db.run("CREATE TABLE MovieToProductionCompany (movieId INTEGER, productionCompanyId INTEGER);");
    db.run("CREATE TABLE Genre (genreId INTEGER, label TEXT);")
    db.run("CREATE TABLE ProductionCompany (productionCompanyId INTEGER, name TEXT);")
}

exports.addMovie = function(movie){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO Movie (id , adult, budget, homepage, imdb_id, original_title, original_language, overview, popularity, production_countries, release_date, revenue, runtime, spoken_languages, status, tagline, title, video, vote_average, vote_count)  VALUES  (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")

        if(movie.adult)
            movie.adult = 1
        else
            movie.adult = 0

        if(movie.video)
            movie.video = 1
        else
            movie.video = 0

        var prodCountries = ""
        for(var i=0; i<movie.production_countries.length ; i++){
            if(i>0)
                prodCountries += ","

            prodCountries += movie.production_countries[i]["iso_3166_1"]
        }

        movie.production_countries = prodCountries

        var spokenLangs = ""
        for(var i=0; i<movie.spoken_languages.length ; i++){
            if(i>0)
                spokenLangs += ","

            spokenLangs += movie.spoken_languages[i]["iso_639_1"]
        }
        movie.spoken_languages = spokenLangs

        stmt.run(movie.id, movie.adult, movie.budget, movie.homepage, movie.imdb_id, movie.original_title, movie.original_language, movie.overview, movie.popularity, movie.production_countries, movie.release_date, movie.revenue, movie.runtime, movie.spoken_languages, movie.status, movie.tagline, movie.title, movie.video, movie.vote_average, movie.vote_count)

        deferred.resolve()
    });

    return deferred.promise

}

exports.addTvShow = function(tvShow){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO TvShow (id, first_air_date, homepage, in_production, languages, last_air_date, name, networks, number_of_episodes, number_of_seasons, origin_country, original_language, original_name, overview, popularity, status, type, vote_average, vote_count)  VALUES  (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")

        if(tvShow.in_production)
            tvShow.in_production = 1
        else
            tvShow.in_production = 0

        var tvNetworks = ""
        for(var i=0; i<tvShow.networks.length ; i++){
            if(i>0)
                tvNetworks += ","

            tvNetworks += tvShow.networks[i].name
        }

        tvShow.networks = tvNetworks

        var spokenLangs = ""
        for(var i=0; i<tvShow.languages.length ; i++){
            if(i>0)
                spokenLangs += ","

            spokenLangs += tvShow.languages[i]
        }
        tvShow.languages = spokenLangs

        var originCountries = ""
        for(var i=0; i<tvShow.origin_country.length ; i++){
            if(i>0)
                originCountries += ","

            originCountries += tvShow.origin_country[i]
        }
        tvShow.origin_country = originCountries

        stmt.run(tvShow.id, tvShow.first_air_date, tvShow.homepage, tvShow.in_production, tvShow.languages, tvShow.last_air_date, tvShow.name, tvShow.networks, tvShow.number_of_episodes, tvShow.number_of_seasons, tvShow.origin_country, tvShow.original_language, tvShow.original_name, tvShow.overview, tvShow.popularity, tvShow.status, tvShow.type, tvShow.vote_average, tvShow.vote_count)

        deferred.resolve()
    });

    return deferred.promise

}

exports.addActor = function(actor){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO Actor (id, adult, biography, birthday, deathday, homepage, imdb_id, name, place_of_birth, popularity, profile_path) VALUES  (?,?,?,?,?,?,?,?,?,?,?)")

        if(actor.adult)
            actor.adult = 1
        else
            actor.adult = 0

        stmt.run(actor.id, actor.adult, actor.biography, actor.birthday, actor.deathday, actor.homepage, actor.imdb_id, actor.name, actor.place_of_birth, actor.popularity, actor.profile_path)

        deferred.resolve()
    });

    return deferred.promise

}

exports.addMovieEntry = function(actorId, movieId, character){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO PlaysInMovie (actorId, movieId, character) VALUES  (?,?,?)")

        stmt.run(actorId, movieId, character)

        deferred.resolve()
    });

    return deferred.promise
}

exports.addMovieCrew = function(actorId, movieId, job){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO CrewInMovie (actorId, movieId, job) VALUES  (?,?,?)")

        stmt.run(actorId, movieId, job)

        deferred.resolve()
    });

    return deferred.promise
}

exports.addTvShowEntry = function(actorId, tvShowId, character){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO PlaysInTvShow (actorId, tvShowId, character) VALUES  (?,?,?)")

        stmt.run(actorId, tvShowId, character)

        deferred.resolve()
    });

    return deferred.promise
}

exports.addTvShowCrew = function(actorId, tvShowId, job){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO CrewInTvShow (actorId, tvShowId, job) VALUES  (?,?,?)")

        stmt.run(actorId, tvShowId, job)

        deferred.resolve()
    });

    return deferred.promise
}

exports.addGenre = function(genreId, label){
    var deferred = q.defer()


        db.serialize(function() {

            var stmt = db.prepare("INSERT INTO Genre (genreId, label) VALUES  (?,?)")

            stmt.run(genreId, label, function(err, row){
                if(err && err.errno != 19) {
                    console.log(err)
                    process.exit()
                }

            })
            deferred.resolve()
        });



    return deferred.promise
}

exports.addProductionCompany = function(productionCompanyId, name){
    var deferred = q.defer()

    try{
        db.serialize(function() {

            var stmt = db.prepare("INSERT INTO ProductionCompany (productionCompanyId, name) VALUES  (?,?)")

            stmt.run(productionCompanyId, name, function(err, row){
                if(err && err.errno != 19) {
                    console.log(err)
                    process.exit()
                }
            })

            deferred.resolve()
        });
    }catch(err){
        console.log(err)
        deferred.resolve()
    }


    return deferred.promise
}

exports.addMovieToGenre = function(movieId, genreId){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO MovieToGenre (movieId, genreId) VALUES  (?,?)")

        stmt.run(movieId, genreId)

        deferred.resolve()
    });

    return deferred.promise
}

exports.addTvShowToGenre = function(tvShowId, genreId){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO TvShowToGenre (tvShowId, genreId) VALUES  (?,?)")

        stmt.run(tvShowId, genreId)

        deferred.resolve()
    });

    return deferred.promise
}

exports.addMovieToProductionCompany = function(movieId, productionCompanyId){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO MovieToProductionCompany (movieId, productionCompanyId) VALUES  (?,?)")

        stmt.run(movieId, productionCompanyId)

        deferred.resolve()
    });

    return deferred.promise
}

exports.getUncrawledMovies = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //var news = []
        db.all("SELECT movieId FROM (SELECT movieId  FROM PlaysInMovie UNION SELECT movieId FROM CrewInMovie) as allMovies WHERE NOT EXISTS (SELECT id as movieId FROM Movie WHERE allMovies.movieId=Movie.id);", function(err, rows) {

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}

exports.getUncrawledTvShows = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //var news = []
        db.all("SELECT DISTINCT tvShowId FROM (SELECT tvShowId  FROM PlaysInTvShow UNION SELECT tvShowId FROM CrewInTvShow) as allTvShows WHERE NOT EXISTS (SELECT id as tvShowId FROM TvShow Where allTvShows.tvShowId=TvShow.id);", function(err, rows) {

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}
//
//exports.getUncrawledMovies()
//    .then(function(rows){
//        console.log(rows.length)
//    })