


const express = require('express');
const router = express.Router();
const { Activities } = require('../models');
const { validateToken } = require('../middlewares/AuthMiddlewares');
const {Subjects} = require('../models');

// get all activities for the logged-in user
router.get('/', validateToken, async (req, res) => {
    const userId = req.user.user_ID; // userId is attached to req.body by validateToken middleware
    try {
        const activities = await Activities.findAll({
            where: { user_ID: userId },
            include: [
                {model: Subjects, attributes: ['subject_Name']}
            ]
        });
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// create a new activity for the logged-in user
router.post('/', validateToken, async (req, res) => {
    const userId = req.user.user_ID; // userId is attached to req.body by validateToken middleware
    const { task_Name, subject_ID, status, deadline } = req.body;

    try {
        const newActivity = await Activities.create({
            task_Name,
            subject_ID: subject_ID,
            user_ID: userId,
            status,
            deadline
        });
        res.status(201).json(newActivity);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// delete an activity by ID for the logged-in user
router.delete('/:id', validateToken, async (req, res) => {
    const userId = req.user.user_ID;
    const activityId = req.params.id;

    try {
        const activity = await Activities.findOne({
            where: {
                activity_ID: activityId,
                user_ID: userId
            }
        });

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        await activity.destroy();
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// updating the status of the task
router.patch('/:id/status', validateToken, async (req, res) => {
    try {
        const { completed } = req.body;
        if (typeof completed !== 'boolean') {
            return res.status(400).json({ error: 'completed must be true or false.' });
        }

        // looking up by id AND user means you can only change your own tasks
        const task = await Activities.findOne({
            where: { activity_ID: req.params.id, user_ID: req.user.user_ID }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        task.status = completed ? 'Completed' : 'Pending';
        await task.save();

        res.json({ message: 'Status updated.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;