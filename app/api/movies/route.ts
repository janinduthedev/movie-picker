import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";

export async function GET() {
  await connectDB();
  const movies = await Movie.find({}).sort({ createdAt: -1 });
  return NextResponse.json(movies);
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newMovie = await Movie.create(body);
    return NextResponse.json(newMovie, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create movie" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Movie.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete movie" }, { status: 500 });
  }
}