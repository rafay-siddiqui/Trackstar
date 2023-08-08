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

async function startServer() {
  try {
    await user_model.createDB();
    await user_model.createTables();
    await user_model.seedDatabase();

    app.listen(PORT, () => {
      console.log(`TRACKSTAR database server running on ${PORT}`);
    });
  } catch (err) {
    console.log('Error while starting up server:', err);
  }
}

//GET demo user profile (name, profile picture)
app.get('/fetch-demo-user', async (req, res) => {
  try {
    const user = await user_model.fetchDemoUser();
    res.json({ user });
  } catch (err) {
    console.err(err)
    res.status(500).json({ error: 'Unable to fetch demo user' })
  }
})

//GET demo user routes
//GET demo user workouts
//POST new route
//POST new workout

startServer();