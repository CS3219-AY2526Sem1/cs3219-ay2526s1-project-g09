import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserModelSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Setting default to the current date/time
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: false,
    expires: 0, // Unverified users should automatically be cleared at given timestamp; Verified users should have a null timestamp
  },

  // Reset password parameters
  resetTokenHash: {
    type: String,
    required: false,
    index: true,
  },
  resetTokenExpiresAt: {
    type: Date,
    required: false,
  },
  passwordChangedAt: {
    type: Date,
    required: false,
  },
});

export default mongoose.model("UserModel", UserModelSchema);
