import express from "express";

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserPrivilege,
} from "../controller/user-controller.js";
import {
  verifyAccessToken,
  verifyIsAdmin,
  verifyIsOwnerOrAdmin,
} from "../middleware/basic-access-control.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", rateLimiter, verifyAccessToken, verifyIsAdmin, getAllUsers);

// Update user privilege (admin only)
router.patch(
  "/:id/privilege",
  rateLimiter,
  verifyAccessToken,
  verifyIsAdmin,
  updateUserPrivilege,
);

// Create user
router.post("/", rateLimiter, createUser);

// Get user by ID
router.get(
  "/:id",
  rateLimiter,
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  getUser,
);

// Update user details
router.patch(
  "/:id",
  rateLimiter,
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  updateUser,
);

// Delete user
router.delete(
  "/:id",
  rateLimiter,
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  deleteUser,
);

export default router;
