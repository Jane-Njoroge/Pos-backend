import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
} from "../controllers/transactionController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);

export default router;
