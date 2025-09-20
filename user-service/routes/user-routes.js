import express from "express";

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserPrivilege,
} from "../controller/user-controller.js";
import { verifyAccessToken, verifyIsAdmin, verifyIsOwnerOrAdmin } from "../middleware/basic-access-control.js";
import { isUsername, isEmail, isPassword } from "../middleware/repository-security.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = express.Router();

router.get("/", rateLimiter, verifyAccessToken, verifyIsAdmin, getAllUsers);

router.patch("/:id/privilege", rateLimiter, verifyAccessToken, verifyIsAdmin, updateUserPrivilege);

router.post("/", rateLimiter, isUsername, isEmail, isPassword, createUser);

router.get("/:id", rateLimiter, verifyAccessToken, verifyIsOwnerOrAdmin, getUser);

router.patch("/:id", rateLimiter, verifyAccessToken, verifyIsOwnerOrAdmin, isUsername, isEmail, isPassword, updateUser);

router.delete("/:id", rateLimiter, verifyAccessToken, verifyIsOwnerOrAdmin, deleteUser);

export default router;
