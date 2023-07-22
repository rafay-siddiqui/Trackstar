const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const user_model = require('./user_model')

app.use(express.json())
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers', 'Access-Control-Allow-Origin');
  next();
})

user_model.createDB();
user_model.createTables();
user_model.seedDatabase();

app.listen(PORT, () => {
  console.log(`TRACKSTAR database server running on ${PORT}`);
});