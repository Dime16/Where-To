const request = require('request');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser());

var getWeather = (lat, lng, callback) => {

    request({
        url: `https://api.darksky.net/forecast/b0708b0871093b854dca9cbd4f3b334f/${lat},${lng}`,
        json: true
    }, (err, res, body) => {
        if(err) {
            callback("Unable to connect to weather server")
        } else if (res.statusCode == 400) {
            callback("unable to get weather")
        } else if (res.statusCode == 200) {
            callback(undefined, {
                temp: body.currently.temperature,
                wind: body.currently.windSpeed
            });
            // responce.render('index', {city: city, lat: lat, lng: lng, temp: temp})
        }
    });
}

module.exports.getWeather = getWeather;