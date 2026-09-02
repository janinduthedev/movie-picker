import mongoose, { Schema, models, model } from "mongoose";

const MovieSchema = new Schema(
  {
    title: { type: String, required: true },
    genre: { type: String, required: true },
    poster: { type: String },
    year: { type: String },
    director: { type: String },
    actors: { type: String },
    plot: { type: String },
    runtime: { type: String },
    imdbRating: { type: String },
    watched: { type: Boolean, default: false,
    }
  },
  { timestamps: true }
);

const Movie = models.Movie || model("Movie", MovieSchema);
export default Movie;