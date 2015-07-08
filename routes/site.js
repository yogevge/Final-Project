var URL = require('url');

var errors = require('../models/errors');
var Person = require('../models/person');

exports.index = function(req, res){
    res.render('index');
};

exports.admin = function(req, res){
    res.locals.query = req.query;
    res.render('admin');
};

exports.createPerson = function(req, res, next){

    var otherPersons = [];
    var other = req.body.other;
    var otherRelationships = req.body.otherRelationship;

    if(other != null && otherRelationships != null) {
        if(other.length == otherRelationships.length) {
            for (var i = 0; i < other.length; i++) {
                otherPersons.push({
                    otherName: other[i],
                    relationship: otherRelationships[i]
                })
            }
        }
    }

    Person.create({
        name: req.body.personName
    }, function (err, person) {
        if (err) {
            if (err instanceof errors.ValidationError) {
                return res.redirect(URL.format({
                    pathname: '/admin',
                    query: {
                        name: req.body.personName,
                        error: err.message
                    }
                }));
            } else {
                return next(err);
            }
        }
        for (var i = 0; i < otherPersons.length; i++) {
            person.createRelationship(otherPersons[i].relationship, otherPersons[i].otherName, function (err) {
                if (err) return next(err);
            });
        }
        return res.redirect(URL.format({
            pathname: '/admin'
        }));
    });
};

exports.modifyPerson = function(req, res, next){

    var otherPersons = [];
    var other = req.body.other;
    var otherRelationships = req.body.otherRelationship;

    if(other != null && otherRelationships != null) {
        if(other.length == otherRelationships.length) {
            for (var i = 0; i < other.length; i++) {
                otherPersons.push({
                    otherName: other[i],
                    relationship: otherRelationships[i]
                })
            }
        }
    }

    Person.get(req.body.name, function (err, person) {
        if (err) return next(err);
        person.removeAllRelationships(function (err) {
            if (err) return next(err);
            for (var i = 0; i < otherPersons.length; i++) {
                person.createRelationship(otherPersons[i].relationship, otherPersons[i].otherName, function (err) {
                    if (err) return next(err);
                });
            }
            return res.redirect(URL.format({
                pathname: '/admin'
            }));
        });

    });
};

exports.removePerson = function(req, res, next){

    Person.get(req.body.name, function (err, person) {
        if (err) return next(err);
        person.deletePerson(function (err) {
            if (err) return next(err);

            return res.redirect(URL.format({
                pathname: '/admin'
            }));
        });

    });
};