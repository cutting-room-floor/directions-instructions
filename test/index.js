var test = require('tape');
var assert = require('assert'),
    extend = require('extend'),
    transform = require('../index');

test('response', function(t) {
    function fixture(name) {
        return require('./fixtures/' + name + '.json');
    }

    t.test('transforms from OSRM JSON format to the MapBox format', function(assert) {
        var actual = transform('mapbox.driving', fixture('berlin.osrm'))[1],
            expected = fixture('berlin.mapbox');
        assert.deepEqual(actual, expected);
        assert.end();
    });

    t.test('transforms waypoints', function(assert) {
        var actual = transform('mapbox.driving', fixture('waypoints.osrm'))[1],
            expected = fixture('waypoints.mapbox');
        assert.deepEqual(actual, expected);
        assert.end();
    });

    t.test('transforms alternate routes', function(assert) {
        var actual = transform('mapbox.driving', fixture('alternate.osrm'))[1];
        assert.equal(actual.routes.length, 2);
        assert.end();
    });

    t.test('produces GeoJSON geometry', function(assert) {
        var actual = transform('mapbox.driving', fixture('simple.osrm'))[1];
        assert.equal(
            actual.routes[0].geometry.type,
            'LineString');
        assert.end();
    });

    t.test('produces polyline geometry', function(assert) {
        var actual = transform('mapbox.driving', fixture('simple.osrm'), {geometry: 'polyline'})[1];
        assert.equal(
            actual.routes[0].geometry,
            'ekeagAhkcnhFdKnNj[`c@tFvHdNdRnNpRdRhWjOpS');
        assert.end();
    });

    t.test('omits geometry', function(assert) {
        var actual = transform('mapbox.driving', fixture('simple.osrm'), {geometry: 'false'})[1];
        assert.strictEqual(actual.routes[0].geometry, undefined);
        assert.end();
    });

    t.test('produces text instructions', function(assert) {
        var actual = transform('mapbox.driving', fixture('simple.osrm'), {instructions: 'text'})[1];
        assert.equal(
            actual.routes[0].steps[0].maneuver.instruction,
            'Head southwest on Market Street');
        assert.end();
    });

    t.test('produces HTML instructions', function(assert) {
        var actual = transform('mapbox.driving', fixture('simple.osrm'), {instructions: 'html'})[1];
        assert.equal(
            actual.routes[0].steps[0].maneuver.instruction,
            "Head <span class='mapbox-directions-direction'>southwest</span> on <span class='mapbox-directions-way-name'>Market Street</span>");
        assert.end();
    });

    t.test('handles errors', function(assert) {
        var actual = transform('mapbox.driving', fixture('no-route.osrm'));
        assert.deepEqual(actual, [200, {"error":"Cannot find route between points","routes":[]}]);
        assert.end();
    });

    t.test('decodes entities in waypoint names', function(assert) {
        var actual = transform('mapbox.driving', extend(true, fixture('simple.osrm'),
            {route_summary: {start_point: 'O&#39;Shaughnessy Boulevard'}}))[1];
        assert.deepEqual(actual.origin.properties.name, 'O\'Shaughnessy Boulevard');
        assert.end();
    });

    t.test('decodes entities in route summaries', function(assert) {
        var actual = transform('mapbox.driving', extend(true, fixture('simple.osrm'),
            {route_name: ['O&#39;Shaughnessy Boulevard']}))[1];
        assert.deepEqual(actual.routes[0].summary, 'O\'Shaughnessy Boulevard - Market Street');
        assert.end();
    })
});
