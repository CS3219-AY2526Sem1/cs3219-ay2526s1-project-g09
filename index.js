const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello from Elastic Beanstalk 🚀");
});

// Health check endpoint to verify env var
app.get("/health", (req, res) => {
  if (process.env.MONGODB_URI) {
    res.send("MongoDB URI: Loaded " + process.env.MONGODB_URI);
  } else {
    res.status(500).send("MongoDB URI: Missing");
  }
  if (process.env.MONGO_URI) {
    res.send("Mongo URI: Loaded " + process.env.MONGO_URI);
  } else {
    res.status(500).send("Mongo URI: Missing");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
