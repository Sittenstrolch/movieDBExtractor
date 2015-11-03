var db = require('./database.js'),
    q  = require('q'),
    request = require('request')

var api_key = "da7e24d8289e92514bc64236c97d2874",
    moviesIds = []


function catchMovies(){
    var deferred = q.defer()

    function getForIndex(index){
        getDataForVideo(moviesIds[index].movieId)  //Change to tvShowId
            .then(function(_id){
                console.log("Saved movie with id " + _id)

                moviesIds.splice(index, 1)

                if(moviesIds.length > 0){
                    getForIndex(0)
                }else{
                    deferred.resolve()
                }
            })
            .catch(function(err){
                if(err == "skip"){
                    moviesIds.splice(index, 1)
                    getForIndex(0)
                }else if (err == "wait"){
                    console.log("Wait triggered in id: " + moviesIds[index].movieId)
                    setTimeout(function() {
                        getForIndex(index)
                    }, 3000);
                }else{
                    console.log(err)
                    console.log("Error triggered in id: " + moviesIds[index].movieId)
                    setTimeout(function() {
                        getForIndex(index)
                    }, 5000);
                }
            })
    }


    db.getUncrawledMovies()
        .then(function(rows){
            moviesIds = rows
            if(moviesIds.length > 0)
                getForIndex(0)
            else{
                deferred.resolve()
                return
            }

        })
        .catch(deferred.reject)

    return deferred.promise
}


function getMovieById(id){
    var deferred = q.defer()
    var endpoint = "/movie/" + id + "?" + "api_key=" + api_key

    var parameters = {
        url: "http://api.themoviedb.org/3" + endpoint,
        headers: {
            'Accept': 'application/json'
        },
        json: true,
        gzip: true
    }

    request(parameters, function (error, response, body) {
        if(body){
            //if(body.status && (body.status != 200 || body.status == 403)){
            //    deferred.reject({
            //        id: id,
            //        error: "Movie API call " + body.message
            //    })
            //    return
            //}

            deferred.resolve(body)
        }else {
            deferred.reject()
        }
    })

    return deferred.promise
}

function getActorsCredits(id){
    var deferred = q.defer()
    var endpoint = "/person/" + id + "/combined_credits?" + "api_key=" + api_key

    var parameters = {
        url: "http://api.themoviedb.org/3" + endpoint,
        headers: {
            'Accept': 'application/json'
        },
        json: true,
        gzip: true
    }

    request(parameters, function (error, response, body) {
        if(body){
            if(body.status && (body.status != 200 || body.status == 403)){
                deferred.reject({
                    id: id,
                    error: "Credit API call " + body.message
                })
                return
            }

            deferred.resolve(body)
        }else{
            deferred.reject()
        }

    })

    return deferred.promise
}

function getDataForVideo(id){
    var deferred = q.defer(),
        apiPromises = []

    //+++++++++++++++++++++++++++++++
    apiPromises.push(getMovieById(id))

    q.all(apiPromises)
        .then(function(result){
            if(result[0].status_code && result[0].status_code == 34) {
                deferred.reject("skip")
                return;
            }else if(result[0].status_code) {
                if(result[0].status_code == 25){
                    deferred.reject("wait")
                    return
                }else{
                    console.log(result[0])
                }
            }
            //Got data for Actor
            var dbPromises = [],
                genres = result[0].genres,
                productionCompanies = result[0].production_companies,
                movieId = result[0].id

            if(genres && productionCompanies && movieId) {

                dbPromises.push(db.addMovie(result[0]))

                for (var i = 0; i < genres.length; i++) {
                    dbPromises.push(db.addMovieToGenre(movieId, genres[i].id))
                    dbPromises.push(db.addGenre(genres[i].id, genres[i].name))
                }

                for (var i = 0; i < productionCompanies.length; i++) {
                    dbPromises.push(db.addMovieToProductionCompany(movieId, productionCompanies[i].id))
                    dbPromises.push(db.addProductionCompany(productionCompanies[i].id, productionCompanies[i].name))
                }
            }else{
                deferred.reject("wait")
                return
            }

            q.all(dbPromises)
                .then(function(){
                    deferred.resolve(movieId)
                })
                .catch(deferred.reject)
        })
        .catch(deferred.reject)

    return deferred.promise
}



catchMovies()
    .then(function(){
        console.log("Finished :D ")
    })
