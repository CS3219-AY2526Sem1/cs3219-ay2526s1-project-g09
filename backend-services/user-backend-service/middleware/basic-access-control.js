import jwt from "jsonwebtoken";
import { findUserById as _findUserById } from "../model/repository.js";

export function verifyAccessToken(req, res, next) {
  // Read token from cookie
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication failed" });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      try {
        // load latest user info from DB
        const dbUser = await _findUserById(payload.id);
        if (!dbUser) {
          return res.status(401).json({ message: "User not found" });
        }

        req.user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          isAdmin: dbUser.isAdmin,
          isVerified: dbUser.isVerified,
        };

        next();
      } catch (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ message: "Internal server error" });
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function verifyIsAdmin(req, res, next) {
  if (req.user.isAdmin) {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Not authorized to access this resource" });
  }
}

export function verifyIsOwnerOrAdmin(req, res, next) {
  if (req.user.isAdmin) {
    return next();
  }

  const userIdFromReqParams = req.params.id;
  const userIdFromToken = req.user.id;
  if (userIdFromReqParams === userIdFromToken) {
    return next();
  }

  return res
    .status(403)
    .json({ message: "Not authorized to access this resource" });
}
