import mongoose from "mongoose";

const Schema = mongoose.Schema;

const OTPSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0, // Expires on the given timestamp (TTL index)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("OTPModel", OTPSchema);
