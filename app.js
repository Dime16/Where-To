const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment-timezone');
const config  = require("./config");
const aws = require('aws-sdk');
const querystring = require('querystring'); 
const path = require('path');
const ejs = require('ejs');

const app = express();

// app.use(bodyParser());
app.use(bodyParser.urlencoded({
    extended: true
}));

const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "/");

app.use(express.static(publicPath));
app.use(bodyParser());
app.set("view engine", "ejs");

let key = new aws.S3({
    weather: process.env.S3_WEKEY,
    geo: process.env.S3_GEOKEY,
    goog: process.env.S3_GOKEY
});


app.get("/", (req, res, next ) => {
    res.render("index.html");

});

app.post("/", (req, responce, next ) => {
    var city = req.body.city;

    var geocodeURL = `http://www.mapquestapi.com/geocoding/v1/address?key=${key.geo}&location=${city}`
 
    axios.get(geocodeURL).then((res) => {
        if(res.data.results[0].locations[0].adminArea5 == "" || res.data.results[0].locations[0].adminArea5 == undefined) {
            responce.render("index1")
        } 

           var lat = res.data.results[0].locations[0].latLng.lat;
           var lng = res.data.results[0].locations[0].latLng.lng;
            responce.redirect(`/places?city=${city}&lat=${lat}&lng=${lng}`);
    }).catch((e) => {
        if(e.code === "ENOTFOUND"){
            console.log("unable to connect to servers");
        } else {
            console.log(e.message);
        }

    });  
});

app.get("/index1", (req, responce, next) => {

    var city = req.body.city;

    var geocodeURL = `http://www.mapquestapi.com/geocoding/v1/address?key=${key.geo}&location=${city}`
 
    axios.get(geocodeURL).then((res) => {
        if(res.data.results[0].locations[0].adminArea5 == "") {
            responce.redirect(`index`)
        } 

           var lat = res.data.results[0].locations[0].latLng.lat;
           var lng = res.data.results[0].locations[0].latLng.lng;
            responce.redirect(`/places?city=${city}&lat=${lat}&lng=${lng}`);
    }).catch((e) => {
        if(e.code === "ENOTFOUND"){
            console.log("unable to connect to servers");
        } else {
            console.log(e.message);
        }

    });  
})

app.get("/places", (req, res, next) => {

    var city = req.query.city;
    var lat = req.query.lat;
    var lng = req.query.lng;
    
            weatherURL = `https://api.darksky.net/forecast/${key.weather}/${lat},${lng}`;

            return axios.get(weatherURL)
            .then((response) => {
            var temp = Math.round((response.data.currently.temperature - 32) * 5/9),
                wind = response.data.currently.windSpeed,
                icon = response.data.currently.icon,
                summary = response.data.currently.summary,
                percip = response.data.currently.precipProbability * 100,
                percipType;

                var time = response.data.timezone;
                var timestamp = response.data.currently.time;
                var localTime = moment(timestamp * 1000).tz(time).format("LLLL");
                var localSplit = localTime.split(" ");
                var AmPm = localSplit.pop();
                var hours = localSplit.slice([localSplit.length - 1], [localSplit.length]).join().split(":")[0];

                // console.log(localTime, AmPm, hours);
                
                if(percip == 0){
                percipType = "rain";
                } else {
                    percipType = response.data.currently.precipType;
                }
                var places = ["amusement_park", "park", "zoo", "cafe", "restaurant", "bar",
                "casino", "movie_theater","shopping_mall", "night_club"];
                var names = places.map((str) => {
                    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/, ' ');
                })

                var namesSelected;
                var selected;
                var image;
                // icon = "sleet";
                if((icon == "clear-day") && ((AmPm == "AM" && hours > 7) || (AmPm == "PM" && hours < 5))) {
                    selected = places.slice(0, 6);
                    namesSelected = names.slice(0, 6);
                    image =  "/img/cities/aerial-1.jpg";
                } else if ((AmPm == "AM" && hours < 7) || (AmPm == "PM" && hours > 7)) {
                    selected = ["cafe", "restaurant", "bar",
                    "casino", "night_club"]
                    namesSelected = ["Cafe", "Restaurant", "Bar",
                    "Casino", "Night club"];
                    image =  "/img/cities/aeral-2.jpg";
                } else {
                    selected = places.slice(3, places.length - 1);
                    namesSelected = names.slice(3, places.length - 1);
                    image =  "/img/cities/rain-1.jpg";
                }
           
                res.render("places", {city: city, names: namesSelected, temp: temp, wind: wind, percip: percip, percipType: percipType, selected: selected, image: image, lat: lat, lng: lng, localTime: localTime, summary: summary});

                // clear-day, clear-night, rain, snow, sleet, wind, fog, cloudy, partly-cloudy-day, or partly-cloudy-night
                //  Tuka treba uste uslovi.
        }).catch((e) => {
            if(e.code === "ENOTFOUND"){
                console.log("unable to connect to servers");
            } else {
                console.log(e.message);
            }

        });
  
})

app.post("/places", (req, res, next) => {
    let keys = Object.keys(req.body);
    let key = keys[0];
    let lat = req.body.lat;
    let lng = req.body.lng;
    let city = req.body.city;
    let temp = req.body.temp;
    let wind = req.body.wind;
    let time = req.body.localTime;

    var googleapi = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=+10000&type=${key}&key=${key.goog}`;
    
    axios.get(googleapi).then((responce) => {
    
        var rating = responce.data.results
        var sorted = rating.slice(0);
        sorted.sort(function (a, b) {
            return b.rating - a.rating;
        })

        var arr = []
        var isOpen = sorted.filter(function(val) {
            return val.opening_hours != undefined;
        }).filter(function(val) {
            return val.opening_hours.open_now != false;
        }).filter(function(val) {
            return val.photos != undefined;
        })

    

       var placesFull = isOpen.slice(0, 24)

       function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        shuffleArray(placesFull);

        places = placesFull.slice(0, 12);

        var name = []; 


       places.forEach(function(e) {
        var place = {
            name: e.name,
            rating: e.rating,
            address: e.vicinity,
            photo: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${e.photos[0].photo_reference}&key=${key.goog}`
        }
        name.push(place);

       });
       var image = `/img/background/${key}.jpg`

        var text = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/, ' ');
       
        return res.render("choice", {name: name, city:city, image: image, wind: wind, temp:temp, text: text});

    }).catch((e) => {  
        console.log(e.message);
    });
})

app.listen(port, () => {
    console.log("server is running on port 3000");
});
