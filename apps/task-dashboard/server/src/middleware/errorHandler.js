import { ZodError } from "zod";
import mongoose from "mongoose";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on the server.";

  if (err instanceof AppError) {
    ({ status, code, message } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = err.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(err.errors).map((e) => e.message).join("; ");
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = "INVALID_ID";
    message = "Invalid identifier.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "Request body is not valid JSON.";
  } else if (err.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body is too large.";
  }

  if (status === 500 && env.NODE_ENV !== "test") console.error(err);

  res.status(status).json({ error: { message, code } });
}
