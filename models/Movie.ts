import { Schema, model, models } from "mongoose";

const MovieSchema = new Schema({
  title: { type: String, required: true },
  genre: { type: String, required: true },
  poster: { type: String },
  rating: { type: Number, default: 0 },
  watched: { type: Boolean, default: false },
}, { timestamps: true });

export const Movie = models.Movie || model("Movie", MovieSchema);