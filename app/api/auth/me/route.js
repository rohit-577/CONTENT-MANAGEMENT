import { getPool } from "@/lib/mysql";
import { requireAuth } from "@/lib/auth";
import { success, failure } from "@/lib/api-response";

export async function GET(req) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.is_active, u.created_at, u.updated_at, r.name AS role
       FROM Users u
       JOIN Roles r ON r.id = u.role_id
       WHERE u.id = ? LIMIT 1`,
      [user.id]
    );

    const dbUser = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (!dbUser) return failure("User not found", 404);

    if (!dbUser.is_active) return failure("Account is deactivated", 403);

    return success({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      is_active: !!dbUser.is_active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
    });
  } catch (err) {
    console.error("GET /api/auth/me", err);
    return failure("Database error", 500);
  }
}
