const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const user_model = require('./user_model')

user_model.createDB();

app.listen(PORT, () => {
  console.log(`TRACKSTAR database server running on ${PORT}`);
});