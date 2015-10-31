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

exports.updateEntry = function(entry){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("UPDATE Entry SET headline=?, subheadline=?, content=?, images=?, custom=?, customHtml=?, date=? WHERE type=? AND date=? ")

        stmt.run(entry.headline, entry.subheadline, entry.content, entry.images, entry.custom, entry.customHtml, entry.date, entry.type, entry.oldDate)

        deferred.resolve()
    });

    return deferred.promise

}

exports.deleteEntry = function(entry){
    var deferred = q.defer()

    db.serialize(function() {
        //var news = []
        var stmt = db.prepare("DELETE FROM Entry WHERE type=? AND date=? ")

        stmt.run(entry.type, entry.date)

        deferred.resolve()


    });

    return deferred.promise
}

exports.getAllNews = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //var news = []
        db.all("SELECT * FROM Entry Where type='news'", function(err, rows) {

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}

exports.getAllEvents = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //var news = []
        db.all("SELECT * FROM Entry Where type='event'", function(err, rows) {

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}

exports.addEvent = function(event){

    db.serialize(function() {

        db.run("INSERT INTO Entry (place, title, date) VALUES  (" +
        "'" + event.place + "'," +
        "'" + event.title + "'," +
        "" + event.date + "" +
        ")")

    });

}