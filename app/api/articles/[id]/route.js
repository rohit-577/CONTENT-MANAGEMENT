import { connectMongo } from "@/lib/mongodb";
import Article from "@/models/Article";
import { articleUpdateSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth";
import { success, failure, parseZodError } from "@/lib/api-response";
import mongoose from "mongoose";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req, { params }) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return failure("Invalid article id", 400);

  try {
    await connectMongo();
    const article = await Article.findById(id).lean();
    if (!article) return failure("Article not found", 404);
    return success(article);
  } catch (err) {
    console.error(`GET /api/articles/${id}`, err);
    return failure("Failed to fetch article", 500);
  }
}

export async function PUT(req, { params }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return failure("Invalid article id", 400);

  try {
    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", 400);

    const parsed = articleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return failure(parseZodError(parsed.error), 400, parsed.error.flatten().fieldErrors);
    }

    if (Object.keys(parsed.data).length === 0) {
      return failure("No fields to update", 400);
    }

    await connectMongo();
    const article = await Article.findById(id);
    if (!article) return failure("Article not found", 404);

    const isOwner = article.authorId === user.id;
    const isAdmin = user.role === "Admin";
    if (!isOwner && !isAdmin) {
      return failure("Forbidden: you can only edit your own articles", 403);
    }

    const update = {};
    if (parsed.data.title !== undefined) update.title = parsed.data.title.trim();
    if (parsed.data.content !== undefined) update.content = parsed.data.content;
    if (parsed.data.excerpt !== undefined) update.excerpt = parsed.data.excerpt.trim();
    if (parsed.data.status !== undefined) update.status = parsed.data.status;
    if (parsed.data.tags !== undefined) update.tags = parsed.data.tags;
    if (parsed.data.coverImage !== undefined) update.coverImage = parsed.data.coverImage;

    const updated = await Article.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

    return success(updated, 200, "Article updated");
  } catch (err) {
    console.error(`PUT /api/articles`, err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0]?.message || "Validation failed";
      return failure(msg, 400);
    }
    return failure(err.message || "Failed to update article", 500);
  }
}

export async function DELETE(req, { params }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return failure("Invalid article id", 400);

  try {
    await connectMongo();
    const article = await Article.findById(id);
    if (!article) return failure("Article not found", 404);

    const isOwner = article.authorId === user.id;
    const isAdmin = user.role === "Admin";
    if (!isOwner && !isAdmin) {
      return failure("Forbidden: you can only delete your own articles", 403);
    }

    await Article.findByIdAndDelete(id);
    return success(null, 200, "Article deleted");
  } catch (err) {
    console.error(`DELETE /api/articles`, err);
    return failure("Failed to delete article", 500);
  }
}
