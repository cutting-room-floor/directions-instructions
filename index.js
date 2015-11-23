var polylineDecode = require('polyline').decode,
  strip = require('strip'),
  entityDecode = require('ent').decode,
  strings = require('./english');

function geoJSONFeature(geometry, properties) {
  return {
    type: 'Feature',
    geometry: geometry,
    properties: properties
  };
}

function geoJSONPoint(point) {
  return {
    type: 'Point',
    coordinates: [point[1], point[0]]
  };
}

function geoJSONLineString(polyline) {
  return {
    type: 'LineString',
    coordinates: polyline.map(function (p) { return [p[1], p[0]]; })
  };
}

var errors = {
  1: 500,   // UNKNOWN_SERVER_ERROR
  2: 400,   // INVALID_PARAMETER
  3: 400,   // PARAMETER_OUT_OF_RANGE
  4: 400,   // REQUIRED_PARAMETER_MISSING
  5: 503,   // SERVICE_UNAVAILABLE
  202: 200, // ROUTE_IS_BLOCKED
  205: 500, // DB_CORRUPTED
  206: 500, // DB_IS_NOT_OPEN
  207: 200, // NO_ROUTE
  208: 400, // INVALID_START_POINT
  209: 400, // INVALID_END_POINT
  210: 400  // START_AND_END_POINTS_ARE_EQUAL
};

module.exports = function(profile, json, options) {
  options = options || {};

  if (json.status === 207 || json.status === 202) {
    return [200, {
      error: json.status_message,
      routes: []
      }];
  } else if (json.status !== 0) {
    return [errors[json.status] || 500, {
      error: json.status_message
    }];
  }

  function transformRoute(summary, polyline, instructions, name) {
    var geometry = polylineDecode(polyline, 6);

    function transformStep(step, i, array) {
      var maneuverId = step[0],
        mode = strings.modes[profile][step[8]],
        maneuverMatch = maneuverId.match(/11-(\d+)/);

      if (maneuverMatch) {
        maneuverId = '11';
      }

      var instruction = step[1] ?
        strings.instructions[maneuverId + '_named'].replace('{way_name}', step[1]) :
        strings.instructions[maneuverId];

      if (options.instructions !== 'html') {
        instruction = strip(instruction);
      }

      instruction = instruction.replace('{direction}', strings.directions[step[6]]);

      var maneuver = {
        type: strings.maneuvers[maneuverId],
        location: geoJSONPoint(geometry[step[3]]),
        instruction: instruction
      };

      if (array.length - 1 === i) {
        return {
          maneuver: maneuver
        };
      } else {
        return {
          maneuver: maneuver,
          distance: step[2],
          duration: step[4],
          way_name: step[1],
          direction: step[6],
          heading: step[7],
          mode: mode
        };
      }
    }

    var result = {
      distance: summary.total_distance,
      duration: summary.total_time,
      summary: name.filter(function(e) { return e !== ''; }).map(entityDecode).join(' - ')
    };

    if (options.geometry === 'polyline') {
      result.geometry = polyline;
    } else if (options.geometry !== 'false') {
      result.geometry = geoJSONLineString(geometry);
    }

    result.steps = instructions.map(transformStep);

    return result;
  }

  var routes = [transformRoute(json.route_summary,
    json.route_geometry,
    json.route_instructions || [],
    json.route_name)];

  var l = Math.min(json.alternative_summaries && json.alternative_summaries.length,
    json.alternative_geometries && json.alternative_geometries.length,
    json.alternative_instructions && json.alternative_instructions.length,
    json.alternative_names && json.alternative_names.length),
    i;

  for (i = 0; i < l; i++) {
    routes.push(transformRoute(json.alternative_summaries[i],
      json.alternative_geometries[i],
      json.alternative_instructions[i],
      json.alternative_names[i]));
  }

  var waypoints = [];

  for (i = 1; i < json.via_points.length - 1; i++) {
    waypoints.push(geoJSONFeature(geoJSONPoint(json.via_points[i]), {}));
  }

  return [200, {
    origin: geoJSONFeature(geoJSONPoint(json.via_points[0]), {
      name: entityDecode(json.route_summary.start_point)
    }),
    destination: geoJSONFeature(geoJSONPoint(json.via_points[json.via_points.length - 1]), {
      name: entityDecode(json.route_summary.end_point)
    }),
    waypoints: waypoints,
    routes: routes
  }];
};
