var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  req.session.accessed = 1;
  res.end();
});

module.exports = router;
