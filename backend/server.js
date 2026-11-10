


// import required modules
const express = require("express");
const cors = require("cors");
const db = require("./models");


// initialize express app
const app = express();
const PORT = 5000;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routers
const userRoutes = require("./routes/Users");
const subjectRoutes = require("./routes/Subjects");
const activityRoutes = require("./routes/Activities");

// routes
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/activities", activityRoutes);

// connect to the database and start the server
db.sequelize.sync().then(() => {
        console.log("Database connected successfully.");
        app.listen(PORT, () => {
            console.log(`Server is running on port: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to the database:", err);
});

