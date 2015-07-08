var neo4j = require('neo4j');
var errors = require('./errors');

var db = new neo4j.GraphDatabase({
    url: process.env['NEO4J_URL'] || process.env['GRAPHENEDB_URL'] ||
    'http://neo4j:neo4j@localhost:7474',
    auth: process.env['NEO4J_AUTH']
});

var Person = module.exports = function Person(_node) {
    this._node = _node;
};

Person.VALIDATION_INFO = {
    'name': {
        required: true,
        minLength: 1,
        maxLength: 16,
        pattern: /^[A-Za-z0-9_ ]+$/,
        message: '2-16 characters; letters, numbers, and underscores only.'
    }
};

Object.defineProperty(Person.prototype, 'name', {
    get: function () { return this._node.properties['name']; }
});


function validate(props, required) {
    var safeProps = {};

    for (var prop in Person.VALIDATION_INFO) {
        var val = props[prop];
        validateProp(prop, val, required);
        safeProps[prop] = val;
    }

    return safeProps;
}

function validateProp(prop, val, required) {
    var info = Person.VALIDATION_INFO[prop];
    var message = info.message;

    if (!val) {
        if (info.required && required) {
            throw new errors.ValidationError(
                'Missing ' + prop + ' (required).');
        } else {
            return;
        }
    }

    if (info.minLength && val.length < info.minLength) {
        throw new errors.ValidationError(
            'Invalid ' + prop + ' (too short). Requirements: ' + message);
    }

    if (info.maxLength && val.length > info.maxLength) {
        throw new errors.ValidationError(
            'Invalid ' + prop + ' (too long). Requirements: ' + message);
    }

    if (info.pattern && !info.pattern.test(val)) {
        throw new errors.ValidationError(
            'Invalid ' + prop + ' (format). Requirements: ' + message);
    }
}

function isConstraintViolation(err) {
    return err instanceof neo4j.ClientError &&
        err.neo4j.code === 'Neo.ClientError.Schema.ConstraintViolation';
}

Person.prototype.deletePerson = function (callback) {

    var query = [
        'MATCH (person:Person {name: {thisName}})',
        'OPTIONAL MATCH (person) -[rel]- ()',
        'DELETE person, rel'
    ].join('\n');

    var params = {
        thisName: this.name
    };

    db.cypher({
        query: query,
        params: params
    }, function (err) {
        callback(err);
    });
};

Person.prototype.removeAllRelationships = function (callback) {

    var query = [
        'MATCH (person:Person {name: {thisName}})',
        'MATCH (person) -[rel]- ()',
        'DELETE rel'
    ].join('\n');

    var params = {
        thisName: this.name
    };

    db.cypher({
        query: query,
        params: params
    }, function (err) {
        callback(err);
    });
};


Person.prototype.createRelationship = function (relationship, otherName, callback) {
    var query = [
        'MATCH (person:Person {name: {thisName}})',
        'MATCH (other:Person {name: {otherName}})',
        'MERGE (person) -[rel:'+relationship+']- (other)'
    ].join('\n');

    var params = {
        thisName: this.name,
        otherName: otherName
    };

    db.cypher({
        query: query,
        params: params
    }, function (err) {
        callback(err);
    });
};

Person.prototype.removeRelationship = function (other, callback) {
    var query = [
        'MATCH (person:Person {name: {thisName}})',
        'MATCH (other:Person {name: {otherName}})',
        'MATCH (person) -[rel]- (other)',
        'DELETE rel'
    ].join('\n');

    var params = {
        thisName: this.name,
        otherName: other.name
    };

    db.cypher({
        query: query,
        params: params
    }, function (err) {
        callback(err);
    });
};

Person.prototype.getAllRelationship = function (callback) {
    var query = [
        'MATCH (person:Person {name: {thisName}})',
        'MATCH (other:Person)',
        'MATCH (person) -[rel]- (other)',
        'RETURN other, rel'
    ].join('\n');

    var params = {
        thisName: this.name
    };

    db.cypher({
        query: query,
        params: params
    }, function (err, results) {
        if (err) return callback(err);

        var output = [];
        for(var i=0; i<results.length; i++){
            output.push({
                otherName: results[i]['other']['properties']['name'],
                relationship: results[i]['rel']['type']
            });
        }

        callback(null, output);
    });
};

Person.prototype.getAllRelationships = function (callback) {
    var query = [
        'MATCH (person:Person {name: {thisName}})',
        'MATCH (other:Person)',
        'MATCH (person) -[rel*1..2]- (other)',
        'RETURN other, rel'
    ].join('\n');

    var params = {
        thisName: this.name
    };

    db.cypher({
        query: query,
        params: params
    }, function (err, results) {
        if (err) return callback(err);

        var nodes = [];
        var links = [];
        for(var i=0; i<results.length; i++){
            if(results[i]['rel'].length == 1) {
                nodes.push({
                    name: results[i]['other']['properties']['name'],
                    id: results[i]['other']['_id']
                });
                links.push({
                    source:  results[i]['rel'][0]['_fromId'],
                    target:  results[i]['rel'][0]['_toId'],
                    type:  results[i]['rel'][0]['type']
                });
            }else{
                links.push({
                    source:  results[i]['rel'][1]['_fromId'],
                    target:  results[i]['rel'][1]['_toId'],
                    type:  results[i]['rel'][1]['type']
                });
            }
        }

        var output = {nodes: nodes, links: links};

        callback(null, output);
    });
};

Person.get = function (name, callback) {
    var query = [
        'MATCH (person:Person {name: {name}})',
        'RETURN person'
    ].join('\n');

    var params = {
        name: name
    };

    db.cypher({
        query: query,
        params: params
    }, function (err, results) {
        if (err) return callback(err);
        if (!results.length) {
            err = new Error('No such person with the name: ' + name);
            return callback(err);
        }

        callback(
            null,
            new Person(results[0]['person']),
            {
                name: results[0]['person']['properties']['name'],
                id: results[0]['person']['_id']
            }
        );
    });
};

Person.getAll = function (callback) {
    var query = [
        'MATCH (person:Person)',
        'RETURN person'
    ].join('\n');

    db.cypher({
        query: query
    }, function (err, results) {
        if (err) return callback(err);
        var persons = results.map(function (result) {
            return (new Person(result['person'])).name;
        });
        callback(null, persons);
    });
};

Person.create = function (props, callback) {
    var query = [
        'CREATE (person:Person {props})',
        'RETURN person'
    ].join('\n');

    var params = {
        props: validate(props)
    };

    db.cypher({
        query: query,
        params: params
    }, function (err, results) {
        if (isConstraintViolation(err)) {
            err = new errors.ValidationError(
                'The name ‘' + props.name + '’ is taken.');
        }
        if (err) return callback(err);
        var person = new Person(results[0]['person']);
        callback(null, person);
    });
};


db.createConstraint({
    label: 'Person',
    property: 'name'
}, function (err, constraint) {
    if (err) throw err;
    if (constraint) {
        console.log('(Registered unique name constraint.)');
    } else {

    }
});
