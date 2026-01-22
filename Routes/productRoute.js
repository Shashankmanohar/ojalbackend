import express from "express";
import { addProduct, getAllproduct, getOneproduct, deleteProduct, updateProduct } from "../Controller/productController.js";
import { upload } from "../Middleware/localupload.js";
import authMiddleware from "../Middleware/auth.js";
const router = express.Router();

// Create product - support both file upload and URL-based images
router.post(
  "/",
  authMiddleware(["admin", "superadmin"]),
  upload.array("images", 5),
  addProduct
);

router.get("/", getAllproduct);
router.get("/:id", getOneproduct);
router.put("/:id", authMiddleware(["admin", "superadmin"]), upload.array("images", 5), updateProduct);
router.delete("/:id", authMiddleware(["admin", "superadmin"]), deleteProduct);
export default router;
