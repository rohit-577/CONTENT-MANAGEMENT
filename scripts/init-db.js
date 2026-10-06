import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const sqlPath = path.join(__dirname, "..", "db", "init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "12345678",
    multipleStatements: true,
  });

  console.log("Connected to MySQL, executing init.sql...");

  // Split by delimiter handling is tricky; since we use DELIMITER // for triggers/procedures
  // the file contains // as delimiter markers. For mysql2 we can just execute the whole file
  // with multipleStatements after replacing DELIMITER lines.
  // Simpler: use raw execution — mysql2 will handle most, but we strip DELIMITER directives.
  const cleaned = sql
    .replace(/^DELIMITER\s+\/\/\s*$/gm, "")
    .replace(/^DELIMITER\s+;\s*$/gm, "")
    .replace(/\/\/\s*$/gm, ";");

  try {
    await connection.query(cleaned);
    console.log("Database initialized successfully (cms_db, tables, view, trigger, procedure).");

    const [rows] = await connection.query("SELECT name FROM cms_db.Roles");
    console.log("Roles:", rows.map((r) => r.name).join(", "));

    const [views] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA='cms_db' AND TABLE_NAME='ActiveAuthorsView'"
    );
    console.log("View ActiveAuthorsView:", views.length ? "exists" : "missing");

    const [triggers] = await connection.query(
      "SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA='cms_db' AND TRIGGER_NAME='trg_after_user_insert'"
    );
    console.log("Trigger trg_after_user_insert:", triggers.length ? "exists" : "missing");

    const [procs] = await connection.query(
      "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA='cms_db' AND ROUTINE_NAME='CreateUserWithRole'"
    );
    console.log("Procedure CreateUserWithRole:", procs.length ? "exists" : "missing");
  } catch (err) {
    console.error("Failed to initialize DB:", err.message);
    if (err.sqlMessage) console.error(err.sqlMessage);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
