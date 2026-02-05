import mongoose, { Schema } from "mongoose";

const viewSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // guest allowed
    },
    sessionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/* Prevent duplicate views */
viewSchema.index(
  { video: 1, viewer: 1, sessionId: 1 },
  { unique: true }
);

export const View = mongoose.model("View", viewSchema);
