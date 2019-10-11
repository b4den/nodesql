var express = require("express");
var body_parser = require("body-parser")
var app = express();
var router = express.Router();
require('dotenv').config();

app.use('/',router);
app.use(express.static(__dirname + '/public'));

router.all('*', (req, res, next) =>  {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

router.use(body_parser.urlencoded({ extended : true }))
router.use(body_parser.json())

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
require('./routes')(router)

