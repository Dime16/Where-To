const request = require('request');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser());


var geocodeAddress = (address, callback) => {

    request({
        url:`http://www.mapquestapi.com/geocoding/v1/address?key=cRxoUwcGCmTPSTNYeq0jtVidw9sFQ8wU&location=${address}`,
        json: true
    }, (err, res, body) => {
        // var city = req.body.city;
     
        if(err) {
            callback('index', {city: "Unable to connect to server"})
        } else if ( body.info.statuscode == 400){
            callback('index', {city: "not a valid location"})
        } else if (body.info.statuscode != 400) {

            callback(undefined, {
                lat: body.results[0].locations[0].latLng.lat,
                lng: body.results[0].locations[0].latLng.lng
            });
        }
    });
}

module.exports.geocodeAddress = geocodeAddress;