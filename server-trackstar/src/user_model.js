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

pgtools.createdb(config, databaseName, (err, res) => {
  if (err) {
    console.error(err);
    process.exit(-1);
  } else (
    console.log("Created database")
  )
})

const pool = new Pool({
  ...config,
  database: databaseName,
});