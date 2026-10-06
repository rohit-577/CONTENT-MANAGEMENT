import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address").max(191),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  role: z.enum(["Admin", "Author"]).optional().default("Author"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const articleCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters").max(50000),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  coverImage: z.string().url("Cover image must be a valid URL").optional().or(z.literal("")),
});

export const articleUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).max(50000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
});
