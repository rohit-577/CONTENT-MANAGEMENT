import mysql from "mysql2/promise";

let pool = null;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createPool() {
  if (pool) return pool;

  const host = process.env.MYSQL_HOST || "localhost";
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!user || !database) {
    throw new Error(
      "MySQL misconfigured: MYSQL_USER and MYSQL_DATABASE must be set. See .env.local.example"
    );
  }
  if (password === undefined) {
    throw new Error("MySQL misconfigured: MYSQL_PASSWORD must be set (can be empty if truly no password)");
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  // Fail fast if pool cannot acquire a connection, but don't crash process on import
  pool.on("connection", () => {});
  pool.on("acquire", () => {});
  pool.on("release", () => {});

  return pool;
}

export function getPool() {
  if (!pool) {
    return createPool();
  }
  return pool;
}

// Convenience: run a query with the pool
export async function query(sql, params) {
  const p = getPool();
  try {
    const [rows] = await p.execute(sql, params);
    return rows;
  } catch (err) {
    // Preserve original error code for callers to map to HTTP status
    err.source = "mysql";
    throw err;
  }
}

export async function getConnection() {
  const p = getPool();
  return p.getConnection();
}

// For health checks
export async function pingMysql() {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}
