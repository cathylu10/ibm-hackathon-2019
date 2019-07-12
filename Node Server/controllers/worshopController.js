require('dotenv').config()
var moment = require('moment');
var validUrl = require('valid-url');
var Cloudant = require('@cloudant/cloudant');
let secureEnv = require('secure-env');


if (process.env.hasOwnProperty("SECRET")) {
    global.env = secureEnv({secret:process.env.SECRET});
    var uRL = global.env.URL

} else if(process.env.hasOwnProperty("VCAP_SERVICES")){
    var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
    uRL = vcap_services.cloudantNoSQLDB[0].credentials.url;

   
} else {
    console.error("No Usable environment files!");
    process.exit(403);
}


var cloudant = new Cloudant({
        url:uRL
});

var DDB = cloudant.db.use("hackathon-donors");
var ADB = cloudant.db.use("hackathon-data");
var approve = cloudant.db.use("hackathon-approvereqs");

//used to easily check if given json has necessary ids
function checkContains(dict,arr) {
    return pms = new Promise(function (resolve, reject) {
        for (let i = 0; i < arr.length; i++) {
            if (dict.hasOwnProperty(arr[i]) == false) {
                reject("found bad id! :" + arr[i]);
            }
        }
        resolve("Sucess!");
    });

}

//returning the similar keys
function giveSimilar(dict, arr) {
    var flist = [];

    for (let i = 0; i < arr.length; i++) {
        if (dict.hasOwnProperty(arr[i]) == true) {
            flist.push(arr[i]);
        }
    }
    return flist;
}



//check if there is an existing id in the database
function findDonor(db, donorfname,donorlname) {
    return new Promise(function(resolve,reject){

        let options = {
              selector: {
                  firstName: { "$eq": donorfname },
                  lastName: { "$eq": donorlname }
              },
              fields: [ "_id" ],
              limit:50
            };

       
        db.find(options).then((body) => {
            console.log("Given:%s and %s",donorfname,donorlname);
             console.log("found is:",body);
            if (body.docs.length !=0) {
                resolve(body.docs[0]["_id"]);
            } else {
                reject("Did not find first and last name combination!");
            }

        }).catch((err) => {
            resolve("Could not run Find!");
        })

    });
}

//check existing entry
function checkExistingDonor(db, iemail) {
    return new Promise(function(resolve,reject){

        let options = {
              selector: {
                  email: { "$eq": iemail }
              },
              fields: [ "_id" ],
              limit:1
            };


        db.find(options).then((body) => {
            if (body.docs.length !=0) {
                reject(body.docs[0]["_id"]);
            } else {
                resolve(body);
            }

        }).catch((err) => {
            resolve("Could not run Find!");
        })

    });
}


//removes element from array
function removeElement(value, arr) {
    //console.log("Found element at:", arr.indexOf(value));
    arr.splice(arr.indexOf(value),1);
    return arr;
}

//evaluate conditions based on strings
function evalCondition(exp1, cond, exp2) {
    if (cond == "<") {
        return exp1 < exp2;
    } else if (cond == ">") {
        return exp1 > exp2;
    } else if (cond == "=") {
        return exp1 == exp2
    };
}

//checks if a variable matches a type
function typeMatch(check,tpe) {
    if (typeof (check) != tpe && tpe != "") {
        return false;
    } else {
        return true;
    }
}



function translate(key, body) {
    return new Promise((resolve,reject)=>{
         //if key is a string
                if (typeof (key) == "string") {
                    //check if dictionary has known definition
                    if (body.hasOwnProperty(key)) {
                        resolve(body[key]);
                    }
                    //check if already matches 
                    for (i in body) {
                        if (body[i] == key) {
                            resolve(key);
                        }
                    }
                    //if not in dictionary and not already translated
                    reject(key," not a valid key!");

                //if key is an object aka json of keys
                } else if (typeof (key) == "object") {//n + m
                    var message = {};
                    var goaround = [];
                    for (i in key) {//m
                        if (body.hasOwnProperty(i)) {
                            message[body[i]]= key[i];
                        } else {
                            goaround.push(i);
                        }
                    }

                    //if there are keys that have not been translated
                    if (goaround.length ==0) {
                        resolve(message);
                    }

                    //check if keys already are translated
                    for (i in body) {//n
                        if (goaround.includes(body[i])) {
                            message[body[i]] = key[body[i]];
                            goaround = removeElement(body[i],goaround);
                        }
                    }

                    if (goaround.length == 0) {
                        resolve(message);
                    } else {
                        reject("invalid keys! "+goaround.toString());
                    }


                //if key is not an accepted type
                } else {
                    reject("invalid parameter type!");
                }

    });
}



function translateBackend(key) {
    return new Promise((resolve,reject)=>{
        approve.get("Translator")
            .then((body)=>{
                translate(key,body)
                    .then((result)=>{resolve(result);})
                    .catch((err)=>{reject(err);});

            })
            .catch((err)=>{
                reject("Could not retrieve translator dictionary!");
            });
                

    
    });

}

function swapjson(data) {
    return new Promise((resolve, reject) => {
        var result = {};
        for (key in data) {
            result[data[key]] = key;
        }

        resolve(result);
    });
}


function translateUser(key) {
    return new Promise((resolve,reject)=>{
        approve.get("Translator")
            .then((body)=>{
                swapjson(body)
                    .then((body)=>{
                        translate(key,body)
                            .then((result)=>{resolve(result);})
                            .catch((err)=>{reject(err);})

                    })
                    .catch((err)=>{
                        reject("inappropriate data type in DB!");
                    });

            })
            .catch((err)=>{
                reject("Could not retrieve translator dictionary!");
            });
    });

}


//recieve all data in the json file
exports.listDonors = function (req, res) {
    DDB.view('donorFeatures', "donorInfo").then((body)=>{

        res.json(body);
        res.end();
    }).catch((err)=>{
        console.log("Unable to get list of entries!");
        res.json({
            "error":"Unable to get list of entries!"
        });
        res.end();
    });
};

//returns json of the entry with the corresponding id
//leaving as is due to query being available
exports.getDonor = function (req, res) {

    findDonor(DDB,req.params.fname,req.params.lname)
        .then((id)=>{
            DDB.get(id).then((body)=>{

                translateUser(body)
                    .then((tbody) => {
                        res.json(tbody);
                        res.end();
                    })
                    .catch((err) => {
                        res.json({
                            "error":err
                        });
                        res.end();
                    });



            }).catch((err)=>{
                console.log("Could not find %s", id);
                res.json({
                    "error":"Could not retrieve file"
                })
                res.end();

            });
        })
        .catch((err) => {
            res.json({
                "error":err
            })
            res.end();
        })

};

//updates workshop
exports.changeDonor = function (req, res) {
    console.log("Received data for Change!:", req.body);

    //check if conf already exists
    findDonor(DDB,req.params.fname,req.params.lname)
        .then((id)=>{
            DDB.get(id).then((body)=>{
                //translate to propper keys
                translateBackend(req.body)
                    .then((reqbody) => {
                        var keylist = Object.keys(reqbody);

                        keylist.forEach(function(it){
                            body[it] = reqbody[it];
                        })


                        DDB.insert(body).catch((err)=>{
                            console.log("Could not insert new revision!")
                            res.json({
                                "error": "Could not insert new revision"
                            });
                            res.end(err);

                        });

                        console.log("Changed Sucessfully!");
                        res.json({
                            "Sucess":true
                        })
                        res.end();
                    })
                    .catch((err) => {
                        res.json({
                            "error":err
                        })
                        res.end();
                    })
                        


            }).catch((err)=>{
                console.log("Could not find %s", req.params.id);
                res.json({
                    "error":404
                })
                res.end();


            });
        })
        .catch((err)=>{
            res.json({
                "error":err
            })
            res.end();
        });



};

exports.deleteDonor = function (req, res) {

    findDonor(DDB,req.params.fname,req.params.lname)
        .then((id)=>{
            DDB.get(id).then((body)=>{

                 DDB.destroy(id, body["_rev"]).catch((err) => {
                     console.log("Could not delete file!:",err);
                     res.json({
                        "error":"Could not delete file!"
                     })
                     res.end();
                 }).then((body)=>{
                     console.log("Deleted!")
                     console.log(body);
                     res.json({
                         "success":true
                     });
                     res.end();
                 })


            }).catch((err)=>{
                console.log("Could not find %s", req.params.id);
                res.json({
                    "error":404
                })
                res.end();

            });
        })
        .catch((err)=>{
            res.json({
                "error":err
            })
            res.end();
        });   

};

////////////////////////////////////////////////////////////////////////////////
//upload workshop functions
function uDT(body) {
    return new Promise((resolve, reject) => {
        translateBackend(body)
            .then((translated)=>{
                resolve(translated);
            })
            .catch((err)=>{
                reject(err);
            })
    });
}

function uD() {
    return new Promise((resolve,reject)=>{
        //pull correct keys from DB
        approve.get("donorProfileFormat")
            .then((keys)=>{
                //console.log("Keys are:",keys);
                templateKeys = [];
                for (it in keys) {

                    if ((it != "_id" && it != "_rev")) {
                        //console.log("pushed:",it);
                        templateKeys.push(it);
                    }
                }
                //console.log("template keys are:", templateKeys);
                resolve(templateKeys);

            })
            .catch((err)=>{
                console.log("Could not Retrieve keys for formating!");
                reject("Could not get required keys for formatting!"+err);
               
            });
    });
}


function uD1(templateKeys,body) {
    return new Promise((resolve,reject)=>{
        //make sure it has correct keys
        //console.log("checking if:", body, " has ",templateKeys);
        checkContains(body,templateKeys)
            .then((result) => {
                resolve();
            })
            .catch((err)=>{
                console.log("Recieved invalid Keys!");
                reject("invalid keys!"+err);
                
            });
    });
}

function uD2(body) {
    return new Promise((resolve,reject)=>{
        //type check the entries
        approve.get("typeCheck")
            .then((FC)=>{

                for (it in body) {
                    if (FC.hasOwnProperty(it) && (it != "_id" && it != "_rev")) {
                        //check it it has the propper type
                        if (!typeMatch(body[it],FC[it])) {
                            throw(it +" does not have the proper type!");
                            break;
                        }

                    }
                }

                resolve();

            })
            .catch((err)=>{
                console.log("Error Performing Type Check!");
                reject("Error Performing Type Check!"+err);
            })
    });
}


function uD4(body) {
    return new Promise((resolve,reject)=>{
    //check if conf already exists
        return checkExistingDonor(DDB,body["email"])
            .then((result1) => {
                resolve();

            })
            .catch((err)=>{
                console.log("%s already Exists! or error retrieving data", body["lastName"]);
                reject("ID already Exists!:"+err);
            });
    });
}

function uD5(body) {
    return new Promise((resolve,reject)=>{
        //insert into database
        DDB.insert(body)
            .then(()=>{
                console.log("Uploaded Sucessfully!");
                resolve();
            })
            .catch((err)=>{
                reject("Could not insert new data");

            });

    });
}

async function uDdriver(body) {
    try {
        let tbody = await uDT(body); //translates to propper keys
        let res = await uD(tbody);//gets correct keys from database for template
        let res2 = await uD1(res,tbody);//checks if form follows propper template
        res = await uD2(tbody);//checks types of data
        res = await uD4(tbody);//check if entry already exists
        res = await uD5(tbody);//insert into CDB database
        return true;
    } catch(e){
        return(e)
    }
}

function uDfinal(body) {
    return new Promise((resolve, reject) => {
        resolve(uDdriver(body));
    });
}

exports.uploadDonor = function (req, res) {

    console.log("Received data for upload!:", req.body);

    uDfinal(req.body)
        .then((response) => {
            if (response != true) {
                res.json({
                    "error":response
                });
                res.end();
            } else {
                res.json({
                    "sucess":response
                });
                res.end;
            }
        })

};

//end Upload workshop functions
////////////////////////////////////////////////////////////////////////////////

exports.queryDonors = function (req, res) {

    //translate req.query keys
    translateBackend(req.query)
        .then((reqquery)=>{

            //supported querys from FormCheck
            approve.get("typeCheck")
                .then((cankeys) =>{
                    var squerys = [];
                    for (it in cankeys) {
                        //console.log("it is:", it);
                            if (it != "_id" && it != "_rev") {
                                squerys.push(it);
                            }
                    }




                    var qkeys = giveSimilar(reqquery,squerys);
                    if (qkeys === undefined || qkeys.length == 0 || qkeys.length != Object.keys(reqquery).length) {
                        //console.log("Undefined Key!");
                        res.json({
                            "error":"invalid query!"
                        });
                        res.end();
                        return;
                    }

                    console.log("Query is:",reqquery);
                    console.log("Similar keys:", ...qkeys);
                    //console.log("value with key:", req.query[qkeys[0]]," Type is:",typeof(req.query[qkeys[0]]));

                    //change view to expand query capabilities
                    DDB.view('donorFeatures', "donorInfo")

                        .then((body)=>{

                            var message = {};

                            if (qkeys.length != 1) {
                                //multi parameter query
                                body.rows.forEach(function(doc){
                                    let allow = true;
                                    for (let i = 0; i < qkeys.length; i++) {
                                        if (doc.value[qkeys[i]] != reqquery[qkeys[i]]) {
                                            allow = false;
                                            break;
                                        }
                                    }

                                    if (allow) {
                                        message[doc.key] = doc.value;
                                    }

                                });

                                res.json(message);
                                res.end();

                            } else {
                                //single parameter query
                                body.rows.forEach(function(doc){
                                    //console.log(doc.value.sday);
                                    //console.log("checking if:",doc.value[qkeys[0]]," equals:", req.query[qkeys[0]],"\n",doc.value[qkeys[0]] == reqquery[qkeys[0]]);

                                    if (doc.value[qkeys[0]] == reqquery[qkeys[0]]) {
                                        message[doc.key] = doc.value;
                                    }

                                })
                                res.json(message);
                                res.end();
                            }


                            


                        })
                        .catch((err)=>{
                                console.log("Error retrieving view!:", err);
                                res.json({
                                    "error":"Error retrieving data!"+err
                                });
                                res.end();
                            })
                }).catch((err)=>{
                    res.json({
                        "error":"error retrieving capable queries!"

                    });
                    res.end();
                });
        
                    
        })
        .catch((err) => {
            res.json({
                "error":"Error translating data!"+err
            })
            res.end();
        })

    //keys that are supported from req

            
}

///////////////////////////////////////////////////////////////////////////////
//start hospitalRegistration

function hD() {
    return new Promise((resolve,reject)=>{
        //pull correct keys from DB
        approve.get("hospitalProfileFormat")
            .then((keys)=>{

                templateKeys = [];
                for (it in keys) {
                    if ((it != "_id" && it != "_rev")) {
                        templateKeys.push(it);
                    }
                }


                resolve(templateKeys);

            })
            .catch((err)=>{
                console.log("Could not Retrieve keys for formating!");
                reject("Could not get required keys for formatting!"+err);
               
            });
    });
}

async function hRdriver(body) {
    try {
        let tbody = await uDT(body); //translates to propper keys
        let res = await hD(tbody);//gets correct keys from database for template
        let res2 = await uD1(res,tbody);//checks if form follows propper template
        res = await uD2(tbody);//checks types of data
        //add in tag if needed

        tbody["classification"] = "hospital";

        res = await uD4(tbody);//check if entry already exists
        res = await uD5(tbody);//insert into CDB database
        return true;
    } catch(e){
        return(e)
    }
}

function hRfinal(body) {
    return new Promise((resolve, reject) => {
        resolve(hRdriver(body));
    });
}



exports.hospitalRegistration = function (req, res) {
    hRfinal(req.body)
        .then((response) => {
            if (response != true) {
                res.json({
                    "error":response
                });
                res.end();
            } else {
                res.json({
                    "sucess":response
                });
                res.end;
            }
        })

}

//end hospital registration
///////////////////////////////////////////////////////////////////////////////
//start donor Regestration


async function dRdriver(body) {
    try {
        let tbody = await uDT(body); //translates to propper keys
        let res = await uD(tbody);//gets correct keys from database for template
        let res2 = await uD1(res,tbody);//checks if form follows propper template
        res = await uD2(tbody);//checks types of data
        //add in tag if needed

        tbody["classification"] = "donor";

        res = await uD4(tbody);//check if entry already exists
        res = await uD5(tbody);//insert into CDB database
        return true;
    } catch(e){
        return(e)
    }
}

function dRfinal(body) {
    return new Promise((resolve, reject) => {
        resolve(dRdriver(body));
    });
}

exports.donorRegistration = function ( req, res) {

   
    dRfinal(req.body)
        .then((response) => {
            if (response != true) {
                res.json({
                    "error":response
                });
                res.end();
            } else {
                res.json({
                    "sucess":response
                });
                res.end;
            }
        })

    
}
//end donor registration
///////////////////////////////////////////////////////////////////////////////
//start login authentication

function authMatch(db, iemail,ipass) {
    return new Promise(function(resolve,reject){

        let options = {
              selector: {
                  email: { "$eq": iemail },
                  password: { "$eq": ipass}
              },
              fields: [ "_id" ],
              limit:1
            };


        db.find(options).then((body) => {
            if (body.docs.length !=0) {
                resolve(body.docs[0]["_id"]);
            } else {
                reject(false);
            }

        }).catch((err) => {
            resolve("Could not run Find!");
        })

    });
}

exports.loginAuth = function (req, res) {
    //given email and pass match with database
    //send sucess or reject

    translateBackend(req.body)
        .then((body)=>{

            checkContains(body,["email","password"])
                .then(()=>{

                    authMatch(DDB,body["email"],body["password"])
                        .then((result) => {
                            res.json({
                                "success":result
                            })
                            res.end();
                        })
                        .catch((err) => {
                            res.json({
                                "error":"Could not find match!"+err
                            })
                            res.end();
                        })

                })
                .catch((err)=>{
                    res.json({
                        "error":"does not contain propper keys!"
                    })
                    res.end();
                });

        })
        .catch((err)=>{
            res.json({
                "error":err
            });
            res.end();
        });

}

//end login authentication
///////////////////////////////////////////////////////////////////////////////
