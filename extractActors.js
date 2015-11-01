var db = require('./database.js'),
    q  = require('q'),
    request = require('request')

var startId = 51850,
    api_key = "da7e24d8289e92514bc64236c97d2874",
    max_id = "1529791"


function catchActors(id){
    var deferred = q.defer(),
        currentId = id

    function getForId(actorId){
        getDataForActor(actorId)
            .then(function(_id){
                console.log("Saved actor with id " + _id)

                if(startId < max_id){
                    currentId += 1
                    getForId(currentId)
                }else{
                    deferred.resolve()
                }
            })
            .catch(function(err){
                if(err == "skip"){
                    currentId += 1
                    getForId(currentId)
                }else if (err == "wait"){
                	setTimeout(function() {
                    	getForId(currentId)
					}, 5000);
                }else{            
                    console.log(err)
                }
            })
    }

    getForId(id)

    return deferred.promise
}


function getActorById(id){
    var deferred = q.defer()
    var endpoint = "/person/" + id + "?" + "api_key=" + api_key

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
                error: "Person API call " + body.message
            })
            return
        }

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

function getDataForActor(id){
    var deferred = q.defer(),
        apiPromises = []

    apiPromises.push(getActorById(id))
    apiPromises.push(getActorsCredits(id))

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
            var dbPromises = []
            dbPromises.push(db.addActor(result[0]))


            var casts = result[1].cast,
                crews = result[1].crew,
                actorId = result[0].id

            for(var i=0; i<casts.length; i++){
                if(casts[i].media_type == "movie")
                    dbPromises.push(db.addMovieEntry(actorId, casts[i].id, casts[i].character))
                else
                    dbPromises.push(db.addTvShowEntry(actorId, casts[i].id, casts[i].character))
            }

            for(var i=0; i<crews.length; i++){
                if(crews[i].media_type == "movie")
                    dbPromises.push(db.addMovieCrew(actorId, crews[i].id, crews[i].job))
                else
                    dbPromises.push(db.addTvShowCrew(actorId, crews[i].id, crews[i].job))
            }

            q.all(dbPromises)
                .then(function(){
                    deferred.resolve(actorId)
                })
                .catch(deferred.reject)
        })
        .catch(deferred.reject)

    return deferred.promise
}



catchActors(startId)
    .then(function(){
        console.log("Finished :D ")
    })
