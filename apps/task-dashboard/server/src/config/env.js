import "dotenv/config";

const isTest = process.env.NODE_ENV === "test";

function required(name) {
  const value = process.env[name];
  if (!value && !isTest) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT || 5001);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: port,
  MONGO_URI: required("MONGO_URI"),
  CORS_ORIGINS: (required("CORS_ORIGIN") || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
