import express from "express";
import {
  getAllProducts,
  getProductByBarcode,
  searchProducts,
  createProduct,
  updateProduct,
} from "../controllers/productController";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/barcode/:barcode", getProductByBarcode);
router.post("/", authorizeRoles("admin", "manager"), createProduct);
router.put("/:id", authorizeRoles("admin", "manager"), updateProduct);

export default router;
