


const express = require('express');

// create a router instance
const router = express.Router();

const {Users} = require('../models');
const {validateToken} = require('../middlewares/AuthMiddlewares');
const bcrypt = require('bcrypt');


const {sign} = require('jsonwebtoken'); // import jsonwebtoken for token generation

// GET route for testing
router.get('/', (req, res) => {
  res.json('Users route is working!');
});

// POST route to create a new user (REGISTER)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // checks whether the user with the provided username already exists in the database
  const existingUser = await Users.findOne({ where: { username } });

  if (existingUser) {
    return res.status(400).json({ error: 'User with this username already exists.' });
  }

  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    } else {
      try {
        const user = await Users.create({ username, password: hashedPassword });
        res.status(201).json(user);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  });
});


// login route to authenticate a user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // find the user by username
  const user = await Users.findOne({ where: { username } });

  if (!user) {
    return res.status(400).json({ error: 'No user found with this username.' });
  }

  // compare the provided password with the hashed password
  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) {
      return res.status(500).json({ error: 'Error comparing passwords' });
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // generate a JWT token for the authenticated user
    const accessToken = sign({ userId: user.user_ID, username: user.username }, "importantsecret", { expiresIn: '1h' });

    // if the passwords match, send a success response
    res.json({ message: 'Login successful.', user, accessToken });
  });
});


router.get('/getMe', validateToken, async (req, res) => {
    
    try{
        const user = await Users.findOne({where: {user_ID: req.user.user_ID}});
        
        if (!user) return res.status(404).json({error: "user not found"});
        return res.status(200).json({username: user.username});
    } catch (error){
        res.status(500).json({ error: error.message });
    }
    
})


// export the router
module.exports = router;