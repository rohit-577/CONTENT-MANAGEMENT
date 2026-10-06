import bcrypt from "bcryptjs";
import { getPool } from "@/lib/mysql";
import { loginSchema } from "@/lib/validation";
import { signToken } from "@/lib/auth";
import { success, failure, parseZodError } from "@/lib/api-response";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", 400);

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parseZodError(parsed.error), 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const pool = getPool();

    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, r.name AS role
       FROM Users u
       JOIN Roles r ON r.id = u.role_id
       WHERE u.email = ? LIMIT 1`,
      [normalizedEmail]
    );

    const user = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (!user) {
      return failure("Invalid email or password", 401);
    }

    if (!user.is_active) {
      return failure("Account is deactivated. Contact an administrator.", 403);
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return failure("Invalid email or password", 401);
    }

    // Non-blocking audit log for login
    pool.execute("INSERT INTO AuditLogs (user_id, action, details) VALUES (?, 'USER_LOGIN', ?)", [
      user.id,
      `User ${user.email} logged in`,
    ]).catch(() => {});

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return success({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login", err);
    if (err.source === "mysql") return failure("Database error", 500);
    return failure(err.message || "Internal server error", 500);
  }
}
