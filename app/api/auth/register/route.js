import bcrypt from "bcryptjs";
import { getPool } from "@/lib/mysql";
import { registerSchema } from "@/lib/validation";
import { signToken } from "@/lib/auth";
import { success, failure, parseZodError } from "@/lib/api-response";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", 400);

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parseZodError(parsed.error), 400, parsed.error.flatten().fieldErrors);
    }

    const { name, email, password, role } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role === "Admin" ? "Admin" : "Author";

    const pool = getPool();

    // Check existing user first for a clean 409 (procedure also checks)
    const [existing] = await pool.execute("SELECT id FROM Users WHERE email = ? LIMIT 1", [normalizedEmail]);
    if (Array.isArray(existing) && existing.length > 0) {
      return failure("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let createdUser;
    try {
      // Call stored procedure — it validates and inserts atomically
      const [results] = await pool.query("CALL CreateUserWithRole(?, ?, ?, ?)", [
        name.trim(),
        normalizedEmail,
        passwordHash,
        normalizedRole,
      ]);

      // MySQL returns result sets; first set contains the SELECT from procedure
      const resultSet = Array.isArray(results) ? results[0] : null;
      if (Array.isArray(resultSet) && resultSet.length > 0) {
        createdUser = resultSet[0];
      } else {
        // Fallback: fetch the user we just created
        const [rows] = await pool.execute(
          "SELECT u.id, u.name, u.email, r.name AS role, u.is_active, u.created_at FROM Users u JOIN Roles r ON r.id = u.role_id WHERE u.email = ? LIMIT 1",
          [normalizedEmail]
        );
        createdUser = rows[0];
      }
    } catch (procErr) {
      const msg = procErr.sqlMessage || procErr.message || "";
      if (msg.includes("Email already exists")) return failure("Email already registered", 409);
      if (msg.includes("Role must be") || msg.includes("Role not found")) return failure(msg, 400);
      if (msg.includes("Invalid email") || msg.includes("Name must be")) return failure(msg, 400);
      throw procErr;
    }

    if (!createdUser || !createdUser.id) {
      return failure("Failed to create user", 500);
    }

    const token = signToken({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      name: createdUser.name,
    });

    return success(
      {
        token,
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        },
      },
      201,
      "Account created"
    );
  } catch (err) {
    console.error("POST /api/auth/register", err);
    if (err.source === "mysql") {
      return failure("Database error", 500);
    }
    if (err.message && err.message.includes("JWT_SECRET")) {
      return failure("Server misconfigured", 500);
    }
    return failure(err.message || "Internal server error", 500);
  }
}
