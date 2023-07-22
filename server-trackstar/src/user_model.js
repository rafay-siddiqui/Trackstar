const { Pool, Client } = require('pg');
const pgtools = require('pgtools');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};
const databaseName = process.env.DB_DATABASE;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      ...config,
      database: databaseName,
    });
  }
  return pool;
}

async function createDB() {
  const client = new Client({...config, database: databaseName});

  try {
    await client.connect();
    await client.end();
  } catch (err) {
    if (err.code === '3D000') {  // '3D000' corresponds to "database does not exist"
      console.log('Database does not exist, creating...');
      await pgtools.createdb({...config, database: 'postgres'}, databaseName);
      console.log("Database created");
    } else {
      console.error("Error creating database: ", err);
    }
  }
}

async function createTables() {
  try {
    const pool = getPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        password VARCHAR(100) NOT NULL,
        weight REAL,
        picture BYTEA
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 0 FROM pg_type WHERE typname = 'coordinate') THEN
          CREATE TYPE coordinate AS (
            lat REAL,
            lng REAL,
            majorPoint BOOLEAN
          );
        END IF;
      END
      $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Routes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(id),
        coordinates coordinate[],
        distance REAL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(id),
        route_id INTEGER REFERENCES Routes(id),
        duration INTEGER[],
        distance REAL,
        weight REAL,
        calories_burned REAL
      );
    `);

    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables: ", error);
  }
}

const seedDatabase = async () => {
  try {
    const pool = getPool();

    const user = await pool.query("SELECT * FROM Users WHERE name = 'Terry Fox'");
    if (user.rowCount === 0) {
      await pool.query("INSERT INTO Users (name, password) VALUES ('Terry Fox', 'trackster')");

      // Replace with the actual coordinates and distance
      const coordinates = ["(49.8951, -97.1384, true)", "(49.2827, -123.1207, true)"];
      const distance = 1234;
      await pool.query("INSERT INTO Routes (user_id, coordinates, distance) VALUES ((SELECT id FROM Users WHERE name = 'Terry Fox'), $1, $2)", [coordinates, distance]);

      // Replace with the actual duration, distance, weight, and calories burned
      const duration = [360, 600]; // for example
      const workoutDistance = 1234;
      const weight = 150;
      const caloriesBurned = 1000;
      await pool.query("INSERT INTO Workouts (user_id, route_id, duration, distance, weight, calories_burned) VALUES ((SELECT id FROM Users WHERE name = 'Terry Fox'), (SELECT id FROM Routes WHERE user_id = (SELECT id FROM Users WHERE name = 'Terry Fox')), $1, $2, $3, $4)", [duration, workoutDistance, weight, caloriesBurned]);

      console.log("Database seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding database: ", error);
  }
};

module.exports = seedDatabase;


module.exports = {
  createDB,
  createTables,
  seedDatabase,
}