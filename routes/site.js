
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.admin = function(req, res){
  res.render('admin');
};

exports.client = function(req, res){
  res.render('client');
};