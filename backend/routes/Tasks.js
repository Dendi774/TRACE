


const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.json('Users route is working!');
});

module.exports = router;