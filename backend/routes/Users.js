


const express = require('express');

// create a router instance
const router = express.Router();

const {Users} = require('../models');
const bcrypt = require('bcrypt');

// simple GET route for testing
router.get('/', (req, res) => {
  res.json('Users route is working!');
});

// POST route to create a new user (REGISTER)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // checks whether the user with the provided email already exists in the database
  const existingUser = await Users.findOne({ where: { email } });

  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    } else {
      try {
        const user = await Users.create({ name, email, password: hashedPassword });
        res.status(201).json(user);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  });
});


// login route to authenticate a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // find the user by email
  const user = await Users.findOne({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: 'No user found with this email.' });
  }

  // compare the provided password with the hashed password
  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) {
      return res.status(500).json({ error: 'Error comparing passwords' });
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // if the passwords match, send a success response
    res.json({ message: 'Login successful.', user });
  });
});

// export the router
module.exports = router;