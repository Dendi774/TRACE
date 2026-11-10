
require("dotenv").config();

// import required modules
const express = require("express");
const cors = require("cors");
const db = require("./models");



// initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: "https://trace-frontend-7c6u.onrender.com",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// middlewares
app.use(cors(corsOptions));
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
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to the database:", err);
});

