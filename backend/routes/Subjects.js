


const express = require('express');
const router = express.Router();
const { Subjects, Activities } = require('../models');
const { validateToken } = require('../middlewares/AuthMiddlewares');

// every route in this file requires a logged-in user
router.use(validateToken);


// all subjects of the logged-in user, with pending/completed/overdue counts
router.get('/', validateToken, async (req, res) => {
  const userId = req.user.user_ID; // userId is attached to req.body by validateToken middleware
  try {
    const subjects = await Subjects.findAll({
      where: { user_ID: userId },
      include: [{ model: Activities, attributes: ['Status', 'Deadline'] }],
      order: [['subject_Name', 'ASC']]
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = subjects.map((subject) => {
      let pending = 0, completed = 0, overdue = 0;

      subject.Activities.forEach((activity) => {
        if (activity.status === 'Completed') {
          completed++;
        } else if (new Date(activity.deadline) < startOfToday) {
          overdue++;
        } else {
          pending++;
        }
      });

      return {
        subject_ID: subject.subject_ID,
        subject_Name: subject.subject_Name,
        pending,
        completed,
        overdue
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// creates new subject 
router.post('/', validateToken, async (req, res) => {
  try {
    const name = (req.body.subjectName || '').trim();
    const userId = req.user.user_ID;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required.' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Subject name must be 100 characters or less.' });
    }

    const subject = await Subjects.create({
      user_ID: userId,
      subject_Name: name
    });

    res.status(201).json({
      Subject_ID: subject.subject_ID,
      Subject_Name: subject.subject_Name,
      pending: 0,
      completed: 0,
      overdue: 0
    });
  } catch (error) {
    // thrown by the unique (User_ID, Subject_Name) index
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'You already have a subject with that name.' });
    }
    res.status(500).json({ error: error.message });
  }
});


// delete a subject and all the activities within that subject
router.delete('/:id', validateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid subject id.' });
    }

    // looking up by BOTH id and user means you can only delete your own subjects
    const subject = await Subjects.findOne({
      where: { subject_ID: id, user_ID: req.user.user_ID }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    await subject.destroy();
    res.json({ message: 'Subject deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;