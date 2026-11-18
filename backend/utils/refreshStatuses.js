// Brings the stored status of tasks up to date with today's date.
//
//   deadline before today       -> Overdue
//   deadline within 7 days      -> Due Soon
//   deadline further away       -> Pending
//   Completed tasks are never touched (only the user changes those)
//
// refreshStatuses(userId)  -> refresh one user's tasks (use on login / when loading tasks)

const { sequelize } = require('../models');

// YYYY-MM-DD using the server's local clock (same rule the front-end uses)
const toDateString = (date) => date.toLocaleDateString('en-CA');

async function refreshStatuses(userId) {
    const today = toDateString(new Date());
    const inAWeek = toDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const replacements = { today, inAWeek };
    if (userId) replacements.userId = userId;

    // one UPDATE sets the right status for every unfinished task
    await sequelize.query(
        `UPDATE Activities
         SET status = CASE
             WHEN DATE(deadline) < :today THEN 'Overdue'
             WHEN DATE(deadline) <= :inAWeek THEN 'Due Soon'
             ELSE 'Pending'
         END
         WHERE status <> 'Completed'
         ${userId ? 'AND user_ID = :userId' : ''}`,
        { replacements }
    );
}

module.exports = { refreshStatuses };