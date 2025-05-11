import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

async function createDatabaseIfNotExists() {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  });

  try {
    await client.connect();
    const dbName = process.env.DB_NAME;
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`;
    const dbExists = await client.query(checkDbQuery);

    if (dbExists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created.`);

      // Connect to the newly created database
      await client.end();
      const newClient = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
        database: dbName,
      });
      await newClient.connect();

      // Install PostGIS and topology extensions
      await newClient.query("CREATE EXTENSION IF NOT EXISTS postgis");
      await newClient.query("CREATE EXTENSION IF NOT EXISTS postgis_topology");
      console.log("PostGIS and topology extensions installed.");

      await newClient.end();
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (error) {
    console.error(
      "Error while creating the database or installing extensions:",
      error
    );
  } finally {
    await client.end();
  }
}

export default createDatabaseIfNotExists;
