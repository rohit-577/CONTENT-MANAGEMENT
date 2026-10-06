import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [10, "Content must be at least 10 characters"],
      maxlength: [50000, "Content cannot exceed 50000 characters"],
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
      default: "",
    },
    // References MySQL Users.id — stored as Number, not ObjectId
    authorId: {
      type: Number,
      required: [true, "authorId is required"],
      index: true,
      validate: {
        validator: Number.isInteger,
        message: "authorId must be an integer",
      },
    },
    authorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 191,
    },
    authorName: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "archived"],
        message: "Status must be draft, published, or archived",
      },
      default: "draft",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 10 && v.every((t) => typeof t === "string" && t.length <= 30);
        },
        message: "Tags must be at most 10 items, each ≤ 30 characters",
      },
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: "Cover image must be a valid URL",
      },
    },
    readTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
articleSchema.index({ authorId: 1, status: 1 });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ title: "text", content: "text", excerpt: "text" });

// Auto-compute excerpt and readTime before save if not provided
articleSchema.pre("save", function (next) {
  if (!this.excerpt && this.content) {
    const plain = this.content.replace(/<[^>]*>/g, "").trim();
    this.excerpt = plain.slice(0, 180) + (plain.length > 180 ? "…" : "");
  }
  if (this.isModified("content")) {
    const words = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(words / 200));
  }
  next();
});

articleSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!update) return next();
  const content = update.content || (update.$set && update.$set.content);
  if (content) {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    if (update.$set) update.$set.readTime = readTime;
    else update.readTime = readTime;

    const excerpt = update.excerpt || (update.$set && update.$set.excerpt);
    if (!excerpt) {
      const plain = content.replace(/<[^>]*>/g, "").trim();
      const autoExcerpt = plain.slice(0, 180) + (plain.length > 180 ? "…" : "");
      if (update.$set) update.$set.excerpt = autoExcerpt;
      else update.excerpt = autoExcerpt;
    }
  }
  next();
});

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);

export default Article;
