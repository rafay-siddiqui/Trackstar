const { Pool } = require('pg');
const pgtools = require('pgtools');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};
const databaseName = process.env.DB_DATABASE;

async function createDB() {
  try {
    await pgtools.createdb(config, databaseName);
    console.log("Database created");
  } catch (err) {
    console.error("Error creating database: ", err);
  }
}


const pool = new Pool({
  ...config,
  database: databaseName,
});

async function createTables() {
  try {

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
    CREATE TYPE IF NOT EXISTS coordinate AS (
      lat REAL,
      lng REAL,
      majorPoint BOOLEAN DEFAULT false
    );
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

module.exports = {
  createDB,
  createTables,
}