const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Node backend working 🚀");
});

let users = []; // temporary storage

app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  users.push({ email, password });

  console.log("Users:", users);

  res.json({
    message: "Signup successful"
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  res.json({
    message: "Login successful",
    user
  });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});