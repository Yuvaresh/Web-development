const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Node backend working 🚀");
});

app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  // reload latest users
  users = JSON.parse(fs.readFileSync("users.json", "utf-8"));

  // check if exists
  if (users.find(u => u.email === email)) {
    return res.json({ message: "User already exists" });
  }

  users.push({ email, password });

  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

  res.json({ message: "Signup successful" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  users = JSON.parse(fs.readFileSync("users.json", "utf-8"));

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login successful", user });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});