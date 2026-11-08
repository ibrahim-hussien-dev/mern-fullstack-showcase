import mongoose from "mongoose";
import { AppError } from "./errorHandler.js";

/** Parse req[source] with a zod schema. Query results land on req.validatedQuery. */
export const validate = (schema, source = "body") => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    if (source === "query") req.validatedQuery = parsed;
    else req[source] = parsed;
    next();
  } catch (err) {
    next(err);
  }
};

export function validateObjectId(req, res, next) {
  const id = req.params.id;
  if (!/^[0-9a-fA-F]{24}$/.test(id) || !mongoose.isValidObjectId(id)) {
    return next(new AppError(400, "INVALID_ID", "Task id must be a valid ObjectId."));
  }
  next();
}
