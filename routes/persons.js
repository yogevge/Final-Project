var URL = require('url');
var request = require('request');
var http = require('http');

var errors = require('../models/errors');
var Person = require('../models/person');

function getPersonURL(person) {
    return '/persons/' + encodeURIComponent(person.name);
}

/**
 * GET /persons
 */
exports.list = function (req, res, next) {
    Person.getAll(function (err, person) {
        if (err) return next(err);
        console.log(person);
        res.json(person);
    });
};

/**
 * POST /persons {name}
 */
exports.create = function (req, res, next) {
    Person.create({
        name: req.body.name
    }, function (err, person) {
        if (err) {
            if (err instanceof errors.ValidationError) {
                return res.redirect(URL.format({
                    pathname: '/persons',
                    query: {
                        name: req.body.name,
                        error: err.message
                    }
                }));
            } else {
                return next(err);
            }
        }
        res.json(person);
    });
};

/**
 * GET /persons/:name
 */
exports.show = function (req, res, next) {
    Person.get(req.params.name, function (err, person,personArray) {
        if (err) return next(err);
        res.json(personArray);
    });
};

/**
 * DELETE /persons/:name
 */
exports.deletePerson = function (req, res, next) {
    Person.get(req.params.name, function (err, person) {
        if (err) return next(err);
        person.deletePerson(function (err) {
            if (err) return next(err);
            res.json(person);
        });
    });
};

/**
 * Get /persons/:name/relationship
 */
exports.getRelationship = function (req, res, next) {
    Person.get(req.params.name, function (err, person) {
        if (err) return next(err);
        person.getAllRelationship(function (err, others) {
            if (err) return next(err);

            res.json(others);
        });
    });
};

/**
 * Get /persons/:name/relationships
 */
exports.getRelationships = function (req, res, next) {
    Person.get(req.params.name, function (err, person) {
        if (err) return next(err);
        person.getAllRelationships(function (err, others) {
            if (err) return next(err);

            res.json(others);
        });
    });
};

/**
 * POST /persons/:name/relationship {otherName,relationship}
 */
exports.createRelationship = function (req, res, next) {
    Person.get(req.params.name, function (err, person) {
        if (err) return next(err);
        Person.get(req.body.otherName, function (err, other) {
            if (err) return next(err);
            person.createRelationship(req.body.relationship,other.name, function (err) {
                if (err) return next(err);
                res.json(person);
            });
        });
    });
};

/**
 * DELETE /persons/:name/relationship {otherName,relationship}
 */
exports.removeRelationship = function (req, res, next) {
    Person.get(req.params.name, function (err, person) {
        if (err) return next(err);
        Person.get(req.body.otherName, function (err, other) {
            if (err) return next(err);
            person.removeRelationship(other, function (err) {
                if (err) return next(err);
                res.json(person);
            });
        });
    });
};

/**
 * GET /persons/description/:name
 */
exports.description = function (req, res, next) {

    var url = 'http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=select+%3Fabstract+%3Fthumbnail+where+%7B+%0D%0A++dbpedia%3A' + req.params.name.replace(" ", "_") + '+dbpedia-owl%3Aabstract+%3Fabstract+%3B%0D%0A+++++++++++++++++++++++++++dbpedia-owl%3Athumbnail+%3Fthumbnail+.%0D%0A++filter%28langMatches%28lang%28%3Fabstract%29%2C%22en%22%29%29%0D%0A%7D&format=application%2Fsparql-results%2Bjson&timeout=30000&debug=on';

    request(url, function(err, response, data) {
        if (!err && res.statusCode == 200) {
            data = JSON.parse(data);
            console.log(data);
            res.json(data);
        }
    });
};