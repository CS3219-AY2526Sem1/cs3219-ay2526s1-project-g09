import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import csurf from "csurf";

import userRoutes from "./routes/user-routes.js";
import authRoutes from "./routes/auth-routes.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const whitelist = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://peerprep-ui-shell.s3-website-ap-southeast-1.amazonaws.com", //Prod
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests (e.g. Postman)
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // for cookies/auth headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-CSRF-Token",
    ],
  }),
); // config cors so that front-end can use

app.use(cookieParser());

// CSRF handling - disabled for development
const enableCsrf = process.env.ENABLE_CSRF === "true";

// CSRF handling
if (enableCsrf) {
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      },
    }),
  );

  app.get("/api/v1/user-service/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
} else {
  // Mock CSRF endpoint when disabled
  // This is for Elastic Beanstalk since we need HTTPS and a Domain to properly do secure routing.
  app.get("/api/v1/user-service/csrf-token", (req, res) => {
    res.json({ csrfToken: "dev-mock-token" });
  });
}

app.use("/api/v1/user-service/users", userRoutes);
app.use("/api/v1/user-service/auth", authRoutes);

app.get("/", (req, res, next) => {
  console.log("Sending Greetings!");
  res.json({
    message: "Hello World from user-service",
  });
  next();
});

// Handle When No Route Match Is Found
app.use((req, res, next) => {
  const error = new Error("Route Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
  next();
});

export default app;
