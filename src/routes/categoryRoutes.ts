import express from "express";
import {
  getAllCategories,
  createCategory,
} from "../controllers/categoryController";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getAllCategories);
router.post("/", authorizeRoles("admin", "manager"), createCategory);

export default router;
