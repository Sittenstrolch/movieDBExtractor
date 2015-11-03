var fs = require("fs");
var file = "data.db";
var exists = fs.existsSync(file);
var q = require("q")

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

db.serialize(function() {
    updateToNewShema()
});

function updateToNewShema(){
    db.run("CREATE TABLE Movie (id INTEGER PRIMARY KEY, adult INTEGER, budget INTEGER, homepage TEXT, imdb_id TEXT, original_title TEXT, original_language TEXT, overview TEXT, popularity REAL, production_countries TEXT, release_date TEXT, revenue INTEGER, runtime INTEGER, spoken_languages TEXT, status TEXT, tagline TEXT, title TEXT, video INTEGER, vote_average REAL, vote_count INTEGER);");
    db.run("CREATE TABLE TvShow (id INTEGER PRIMARY KEY, first_air_date TEXT, homepage TEXT, in_production INTEGER, languages TEXT, last_air_date TEXT, name TEXT, networks TEXT, number_of_episodes INTEGER, number_of_seasons INTEGER, origin_country TEXT, original_language TEXT, original_name TEXT, overview TEXT, popularity REAL, status TEXT, type TEXT, vote_average REAL, vote_count INTEGER );");
    db.run("CREATE TABLE MovieToGenre (movieId INTEGER, genreId INTEGER);");
    db.run("CREATE TABLE TvShowToGenre (tvShowId INTEGER, genreId INTEGER);");
    db.run("CREATE TABLE MovieToProductionCompany (movieId INTEGER, productionCompanyId INTEGER);");
    db.run("CREATE TABLE Genre (genreId INTEGER PRIMARY KEY, label TEXT);")
    db.run("CREATE TABLE ProductionCompany (productionCompanyId INTEGER PRIMARY KEY, name TEXT);")
}