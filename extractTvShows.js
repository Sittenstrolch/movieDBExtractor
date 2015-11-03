var db = require('./database.js'),
    q  = require('q'),
    request = require('request')

var api_key = "da7e24d8289e92514bc64236c97d2874",
    tvShowIds = []


function catchTvShows(){
    var deferred = q.defer()

    function getForIndex(index){
        getDataForVideo(tvShowIds[index].tvShowId)  //Change to tvShowId
            .then(function(_id){
                console.log("Saved tvShow with id " + _id)

                tvShowIds.splice(index, 1)

                if(tvShowIds.length > 0){
                    getForIndex(0)
                }else{
                    deferred.resolve()
                }
            })
            .catch(function(err){
                if(err == "skip"){
                    tvShowIds.splice(index, 1)
                    getForIndex(0)
                }else if (err == "wait"){
                    console.log("Wait triggered in id: " + tvShowIds[index].movieId)
                    setTimeout(function() {
                        getForIndex(index)
                    }, 3000);
                }else{
                    console.log(err)
                    console.log("Error triggered in id: " + tvShowIds[index].movieId)
                    setTimeout(function() {
                        getForIndex(index)
                    }, 5000);
                }
            })
    }


    db.getUncrawledTvShows()
        .then(function(rows){
            tvShowIds = rows
            if(tvShowIds.length > 0)
                getForIndex(0)
            else{
                deferred.resolve()
                return
            }

        })
        .catch(deferred.reject)

    return deferred.promise
}


function getTvShowById(id){
    var deferred = q.defer()
    var endpoint = "/tv/" + id + "?" + "api_key=" + api_key

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
    apiPromises.push(getTvShowById(id))

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
                tvShowId = result[0].id

            if(genres && tvShowId) {

                dbPromises.push(db.addTvShow(result[0]))

                for (var i = 0; i < genres.length; i++) {
                    dbPromises.push(db.addTvShowToGenre(tvShowId, genres[i].id))
                    dbPromises.push(db.addGenre(genres[i].id, genres[i].name))
                }

            }else{
                deferred.reject("wait")
                return
            }

            q.all(dbPromises)
                .then(function(){
                    deferred.resolve(tvShowId)
                })
                .catch(deferred.reject)
        })
        .catch(deferred.reject)

    return deferred.promise
}



catchTvShows()
    .then(function(){
        console.log("Finished :D ")
    })
