import { AppError } from './errorHandler.js';

/** validate(zodSchema, 'body' | 'query' | 'params') – replaces req[source] with the parsed (stripped, coerced) value. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', details));
  }
  req[source] = result.data;
  return next();
};
