
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var engine = require('ejs-locals');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/public/partials');
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.locals({
    title: 'Neo4j Einstein'
});

// Routes

app.get('/', routes.site.index);
app.get('/admin', routes.site.admin);
app.post('/admin', routes.site.createPerson);
app.post('/admin/modify', routes.site.modifyPerson);
app.post('/admin/remove', routes.site.removePerson);

app.get('/persons',routes.persons.list);
app.get('/persons/:name',routes.persons.show);
app.get('/persons/description/:name',routes.persons.description);

app.post('/persons', routes.persons.create);
app.delete('/persons/:name', routes.persons.deletePerson);

app.get('/persons/:name/relationship', routes.persons.getRelationship);
app.get('/persons/:name/relationships', routes.persons.getRelationships);
app.post('/persons/:name/relationship', routes.persons.createRelationship);
app.delete('/persons/:name/relationship', routes.persons.removeRelationship);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening at: http://localhost:%d/', app.get('port'));
});
