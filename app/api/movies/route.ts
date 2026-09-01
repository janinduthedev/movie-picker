import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Movie } from "@/models/Movie";

export async function GET() {
  try {
    await connectDB();
    const movies = await Movie.find({}).sort({ createdAt: -1 });
    return NextResponse.json(movies, { status: 200 });
  } catch (error: any) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch movies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, genre, poster } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const existing = await Movie.findOne({ title });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const newMovie = await Movie.create({ title, genre, poster });
    return NextResponse.json(newMovie, { status: 201 });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    await Movie.findByIdAndDelete(id);
    return NextResponse.json({ message: "Movie deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}