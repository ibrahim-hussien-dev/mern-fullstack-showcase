import { Router } from "express";
import { validate, validateObjectId } from "../middleware/validate.js";
import {
  createSchema, patchSchema, listSchema,
  listTasks, createTask, getTask, updateTask, deleteTask,
} from "../controllers/tasksController.js";

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const router = Router();
router.get("/", validate(listSchema, "query"), asyncHandler(listTasks));
router.post("/", validate(createSchema), asyncHandler(createTask));
router.get("/:id", validateObjectId, asyncHandler(getTask));
router.patch("/:id", validateObjectId, validate(patchSchema), asyncHandler(updateTask));
router.delete("/:id", validateObjectId, asyncHandler(deleteTask));

export default router;
