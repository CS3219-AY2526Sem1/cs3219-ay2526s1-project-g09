import UserModel from "./user-model.js";
import OTPModel from "./otp-model.js";
import "dotenv/config";
import { connect } from "mongoose";

export async function connectToDB() {
  let mongoDBUri =
    process.env.ENV === "PROD"
      ? process.env.DB_CLOUD_URI
      : process.env.DB_LOCAL_URI;

  await connect(mongoDBUri);
}

// User Model
export async function createUser(username, email, password) {
  return new UserModel({ username, email, password }).save();
}

export async function findUserByEmail(email) {
  return UserModel.findOne({ email });
}

export async function findUserById(userId) {
  return UserModel.findById(userId);
}

export async function findUserByUsername(username) {
  return UserModel.findOne({ username });
}

export async function findUserByUsernameOrEmail(username, email) {
  return UserModel.findOne({
    $or: [{ username }, { email }],
  });
}

export async function findAllUsers() {
  return UserModel.find();
}

export async function updateUserById(userId, username, email, password) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        username,
        email,
        password,
      },
    },
    { new: true }, // return the updated user
  );
}

export async function updateUserPrivilegeById(userId, isAdmin) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        isAdmin,
      },
    },
    { new: true }, // return the updated user
  );
}

export async function updateVerificationById(userId, isVerified) {
  return UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        isVerified,
      },
    },
    { new: true }, // return the updated user
  );
}

export async function updateUserExpirationById(userId, timestamp) {
  const update = {};
  if (timestamp) {
    update.expiresAt = timestamp;
  } else {
    update.expiresAt = null;
  }

  return UserModel.findByIdAndUpdate(userId, update, { new: true });
}

export async function deleteUserById(userId) {
  return UserModel.findByIdAndDelete(userId);
}

// OTP Model
export async function findOTPByEmail(email) {
  return OTPModel.findOne({ email });
}

export async function deleteOTPByEmail(email) {
  return OTPModel.deleteMany({ email });
}

export async function createOTPForEmail(email, code, expiresAt) {
  const createdAt = Date.now();
  return new OTPModel({ email, code, expiresAt, createdAt }).save();
}
