export const errorHandler = (err, req, res, next) => {
  console.error("❌ API Error:", err.stack || err.message || err);

  let statusCode = 500;
  if (err.status && typeof err.status === "number") {
    statusCode = err.status;
  } else if (err.statusCode && typeof err.statusCode === "number") {
    statusCode = err.statusCode;
  }

  let message = err.message || "An unexpected server error occurred.";

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size exceeds the maximum limit of 25MB.";
  }

  // Provide a crystal clear error message for OpenAI API authentication/quota issues
  if (
    message.includes("API key") ||
    message.includes("401") ||
    message.includes("403") ||
    statusCode === 401 ||
    statusCode === 403 ||
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY.includes("your_openai")
  ) {
    statusCode = 403;
    message = "OpenAI API Error (403 Forbidden): Invalid or missing OPENAI_API_KEY. Please edit backend/.env and replace 'your_openai_api_key_here' with your real OpenAI API key (sk-...).";
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
