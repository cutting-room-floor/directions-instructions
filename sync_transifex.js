var request = require('request'),
  fs = require('fs');

var outdir = './locales/';
var api = 'https://www.transifex.com/api/2/';
var project = api + 'project/directions-instructions/';

var auth = {
  user: process.env.TRANSIFEX_USER,
  pass: process.env.TRANSIFEX_PASSWORD
};

getResource('core', function(err, res) {
  fs.writeFileSync('translations.json', JSON.stringify(res));
});

function getResource(resource, callback) {
  resource = project + 'resource/' + resource + '/';
  getLanguages(resource, function(err, codes) {
    if (err) return callback(err);

    asyncMap(codes, getLanguage(resource), function(err, results) {
      if (err) return callback(err);

      var locale = {};
      results.forEach(function(result, i) {
        locale[codes[i]] = result;
      });

      callback(null, locale);
    });
  });
}

function getLanguage(resource) {
  return function(code, callback) {
    code = code.replace(/-/g, '_');
    var url = resource + 'translation/' + code;
    if (code === 'vi') url += '?mode=reviewed';
    request.get(url, { auth : auth }, function(err, resp, body) {
      if (err) return callback(err);
      callback(null, JSON.parse(JSON.parse(body).content));
    });
  };
}

function getLanguages(resource, callback) {
  request.get(resource + '?details', { auth: auth }, function(err, resp, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body).available_languages.map(function(d) {
      return d.code.replace(/_/g, '-');
    }).filter(function(d) {
      return d !== 'en';
    }));
  });
}

function asyncMap(inputs, func, callback) {
  var remaining = inputs.length,
    results = [],
    error;

  inputs.forEach(function(d, i) {
    func(d, function done(err, data) {
      if (err) error = err;
      results[i] = data;
      remaining --;
      if (!remaining) callback(error, results);
    });
  });
}
