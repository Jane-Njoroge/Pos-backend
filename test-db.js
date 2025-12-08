const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      "admin",
    ]);
    console.log("Database connection successful!");
    console.log("Users found:", result.rows);
    process.exit(0);
  } catch (error) {
    console.error("Database error:", error.message);
    process.exit(1);
  }
}

test();
