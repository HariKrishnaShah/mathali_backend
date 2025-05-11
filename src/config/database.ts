import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "mydatabase",
  entities: [path.join(__dirname, "../entities/**/*.{ts,js}")],
  synchronize: true, // For development, sync entities with the database
  logging: false, // Enable logging for debugging
  extra: {
    // The pg pool settings go here. For example:
    max: 20, // max number of connections
    min: 2, // min number of connections
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    // You can add more PG pool config if needed
  },
});

// Read-Only Connection
// export const ReadOnlyDataSource = new DataSource({
//   type: "postgres",
//   host: process.env.DB_HOST || "localhost",
//   port: Number(process.env.DB_PORT) || 5432,
//   username: process.env.DB_READ_USERNAME || "readonly_user", // Read-only user
//   password: process.env.DB_READ_PASSWORD || "readonly_password",
//   database: process.env.DB_NAME || "mydatabase",
//   entities: [path.join(__dirname, "../entities/**/*.{ts,js}")],
//   synchronize: false, // Do NOT sync schema with read-only user
//   logging: false,
//   extra: {
//     max: 10,
//     min: 2,
//     idleTimeoutMillis: 30000,
//   },
// });
