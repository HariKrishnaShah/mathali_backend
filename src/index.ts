import express, { Request, Response, NextFunction } from "express";
import errorMiddleware from "./middleware/errorMiddleware";
import "reflect-metadata"; // Add this line to your entry file (e.g., app.ts or server.ts)
import { AppDataSource } from "./config/database";
import createDatabaseIfNotExists from "./config/createDatabaseIfNotExists";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { scheduleLoginLogDeletion } from "./util/cron jobs/deleteLoginLog";
const cors = require("cors");
import { createServer } from "http";
import { initializeSocket } from "./config/socket";
// import { ReadOnlyDataSource } from "./config/database";
import path from "path";
import isLoggedIn from "./middleware/isLoggedIn";
dotenv.config();

const app = express();
const httpServer = createServer(app);
app.use(cookieParser());
const corsOptions = {
  origin: [
    "http://localhost:3002",
    "https://www.manthali.palikagis.com",
    "https://manthali.palikagis.com",
    "https://palikagis.com",
    "https://www.palikagis.com",
  ], // Allow only a specific domain
  credentials: true,
  methods: "GET,POST, PATCH, DELETE, PUT", // Allow only specific methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow only specific headers
};

app.use(cors(corsOptions));
// Handle Preflight Requests (Important for WebSockets & Complex Requests)
app.options("*", cors(corsOptions));
const port = process.env.PORT || 4000;
const userRoutes = require("./routes/users");
const wardRoutes = require("./routes/ward");
const landCadastral = require("./routes/landCadastral");

const landZonesRoutes = require("./routes/landZones");
const houseRoutes = require("./routes/house");
const roadRoutes = require("./routes/road");
const surveyRoutes = require("./routes/survey");
const responseRoutes = require("./routes/response");
const digitalProfileRoutes = require("./routes/digitalProfile");
const roadCordinatesRoutes = require("./routes/roadCordinate");
const cadastralUpdateRequestRoutes = require("./routes/cadastralUpdateRequest");
const databaseBackupRoutes = require("./routes/databaseBackupRoute");
const sifarishRoutes = require("./routes/sifarish");
const valuationSifarishRoutes = require("./routes/valuationSifarish");
const gharBatoSifarishRoutes = require("./routes/gharBatoSifarish");
const speechRoutes = require("./routes/googleTextToSpeech");
const landmarksRoutes = require("./routes/landmark");
app.use(express.json());
createDatabaseIfNotExists().then(() => {
  // Initialize TypeORM connection
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connection initialized");
    })
    .catch((error) =>
      console.log("Error during Data Source initialization", error)
    );
});
// Initialize TypeORM connection
// ReadOnlyDataSource.initialize()
//   .then(() => {
//     console.log("Read only Connection to Database connection initialized");
//   })
//   .catch((error) =>
//     console.log("Error during Read only Data Source initialization", error)
//   );
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});
initializeSocket(httpServer);
// Example route that throws an AppError
const survey_data = path.join(__dirname, "./uploads/survey_data");
console.log(survey_data);

// Serve static files
app.use("/api/survey_data", isLoggedIn, express.static(survey_data));
app.use("/api/user", userRoutes);
app.use("/api/ward", wardRoutes);
app.use("/api/cadastral", landCadastral);
app.use("/api/cadastral-update", cadastralUpdateRequestRoutes);

app.use("/api/landzones", landZonesRoutes);
app.use("/api/house", houseRoutes);
app.use("/api/road", roadRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/survey/response", responseRoutes);
app.use("/api/digital-profile", digitalProfileRoutes);
app.use("/api/road/cordinates", roadCordinatesRoutes);
app.use("/api/database", databaseBackupRoutes);
app.use("/api/sifarish", sifarishRoutes);
app.use("/api/valuation-sifarish", valuationSifarishRoutes);
app.use("/api/ghar-bato-sifarish", gharBatoSifarishRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/digital-profile/landmarks", landmarksRoutes);
app.use(errorMiddleware);

//cron job to delete all login Repo details
scheduleLoginLogDeletion();

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
