export function success(data, status = 200, message) {
  const body = { success: true, data, error: null };
  if (message) body.message = message;
  return Response.json(body, { status });
}

export function failure(error, status = 400, details) {
  const body = { success: false, data: null, error };
  if (details) body.details = details;
  return Response.json(body, { status });
}

export function parseZodError(err) {
  const fieldErrors = err.flatten ? err.flatten().fieldErrors : {};
  const firstField = Object.keys(fieldErrors)[0];
  if (firstField && fieldErrors[firstField]?.[0]) {
    return `${firstField}: ${fieldErrors[firstField][0]}`;
  }
  return err.errors?.[0]?.message || "Validation failed";
}
