import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    sessionId: { type: String, required: true },
  },
  { _id: false },
);

const QuestionInfoSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    title: { type: String },
    body: { type: String },
    difficulty: { type: String },
    topics: { type: [String], default: [] },
    hints: { type: [String], default: [] },
    answer: { type: String },
    timeLimit: { type: Number },
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  questionId: { type: String, required: true },
  participants: { type: [ParticipantSchema], default: [] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  timeTaken: { type: Number },
  question: { type: QuestionInfoSchema },
});

SessionSchema.index(
  { "participants.userId": 1, "participants.sessionId": 1 },
  {
    partialFilterExpression: {
      "participants.active": true,
    },
    name: "participants_active_lookup",
    sparse: false,
  },
);

export default mongoose.model("Session", SessionSchema, "sessions");
