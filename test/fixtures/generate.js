var OSRM = require('osrm');
var fs = require('fs');
var transform = require('../../src/api-transform');

var osrm = new OSRM('test/data/berlin-latest.osrm');
var start = [52.519930,13.438640];
var end = [52.513191,13.415852];

var query = osrm.route({coordinates: [start, end], printInstructions: true}, function(err, result) {
  fs.writeFileSync('test/fixtures/berlin.osrm.json', JSON.stringify(result, null, 4));
  fs.writeFileSync('test/fixtures/berlin.mapbox.json', JSON.stringify(transform('mapbox.driving', result)[1], null, 4));
});

