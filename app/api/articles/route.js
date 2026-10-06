import { connectMongo } from "@/lib/mongodb";
import Article from "@/models/Article";
import { articleCreateSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth";
import { success, failure, parseZodError } from "@/lib/api-response";

export async function GET(req) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    await connectMongo();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const authorIdParam = searchParams.get("authorId");
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && ["draft", "published", "archived"].includes(status)) {
      filter.status = status;
    }
    if (authorIdParam) {
      const aid = parseInt(authorIdParam, 10);
      if (!Number.isNaN(aid)) filter.authorId = aid;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Article.countDocuments(filter),
    ]);

    return success({
      articles: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/articles", err);
    if (err.source === "mongodb") return failure("Database error", 500);
    return failure("Failed to fetch articles", 500);
  }
}

export async function POST(req) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  if (!["Author", "Admin"].includes(user.role)) {
    return failure("Forbidden: Authors and Admins only", 403);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", 400);

    const parsed = articleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parseZodError(parsed.error), 400, parsed.error.flatten().fieldErrors);
    }

    await connectMongo();

    const doc = await Article.create({
      title: parsed.data.title.trim(),
      content: parsed.data.content,
      excerpt: parsed.data.excerpt?.trim() || "",
      status: parsed.data.status || "draft",
      tags: parsed.data.tags || [],
      coverImage: parsed.data.coverImage || "",
      authorId: user.id,
      authorEmail: user.email,
      authorName: user.name,
    });

    return success(doc, 201, "Article created");
  } catch (err) {
    console.error("POST /api/articles", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0]?.message || "Validation failed";
      return failure(msg, 400);
    }
    if (err.source === "mongodb") return failure("Database error", 500);
    return failure(err.message || "Failed to create article", 500);
  }
}
