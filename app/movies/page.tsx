"use client";

import { useState, useEffect, useTransition } from "react";

export default function MoviePickerPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedMovies, setSavedMovies] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    async function fetchSavedMovies() {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (res.ok) {
          setSavedMovies(data);
        }
      } catch (error) {
        console.error("Failed to fetch saved movies", error);
      }
    }
    fetchSavedMovies();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=8618664a`);
      const data = await res.json();
      setSearchResults(data.Search || []);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoadingSearch(false);
    }
  }

  async function handleAddMovie(movie: any) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${movie.Title} (${movie.Year})`,
            genre: movie.Type || "Movie",
            poster: movie.Poster !== "N/A" ? movie.Poster : "",
          }),
        });

        if (res.ok) {
          const newMovie = await res.json();
          setSavedMovies((prev) => {
            if (prev.some((m) => m._id === newMovie._id)) return prev;
            return [newMovie, ...prev];
          });
        }
      } catch (error) {
        console.error("Add movie error", error);
      }
    });
  }

  async function handleDeleteMovie(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/movies?id=${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setSavedMovies((prev) => prev.filter((movie) => movie._id !== id));
        }
      } catch (error) {
        console.error("Delete movie error", error);
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Movie Picker
          </h1>
          <p className="text-slate-400 text-sm">Search movies and manage your saved.</p>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Search & Results (Span 6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies (e.g., Avatar, Matrix)..."
                className="flex-1 bg-transparent px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={loadingSearch}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm"
              >
                {loadingSearch ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Search Results */}
            <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <h2 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                <span></span> Search Results ({searchResults.length})
              </h2>

              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <p className="text-3xl">🔍</p>
                  <p className="text-sm">Type a movie name above to search.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {searchResults.map((movie: any) => (
                    <div
                      key={movie.imdbID}
                      className="flex justify-between items-center p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {movie.Poster !== "N/A" ? (
                          <img src={movie.Poster} alt={movie.Title} className="w-12 h-16 object-cover rounded-lg shadow" />
                        ) : (
                          <div className="w-12 h-16 bg-slate-700 rounded-lg flex items-center text-[10px] text-slate-400 justify-center text-center">
                            No Image
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-200 text-sm truncate max-w-[180px]">{movie.Title}</h3>
                          <p className="text-xs text-slate-400">{movie.Year} • <span className="uppercase text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">{movie.Type}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMovie(movie)}
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Saved Movies Collection (Span 6) */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 h-full flex flex-col">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span></span> My Watchlist Collection
                </h2>
                <span className="bg-purple-950 text-purple-300 border border-purple-800/50 px-3 py-0.5 rounded-full text-xs font-bold">
                  {savedMovies.length} Saved
                </span>
              </div>

              {savedMovies.length === 0 ? (
                <div className="text-center py-24 text-slate-500 space-y-2 flex-1 flex flex-col justify-center items-center">
                  <p className="text-4xl">🍿</p>
                  <p className="text-sm">No movies saved in your collection yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[530px] overflow-y-auto pr-1 flex-1">
                  {savedMovies.map((movie: any) => (
                    <div
                      key={movie._id}
                      className="flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-700/40 transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-14 h-20 bg-slate-700 rounded-lg flex items-center text-[10px] text-slate-400 justify-center text-center">
                            No Image
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-100 text-sm truncate max-w-[200px] sm:max-w-[280px]">{movie.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">Genre: <span className="text-purple-300">{movie.genre}</span></p>
                          <span className="inline-block mt-2 text-[10px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                            Saved in Vault
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMovie(movie._id)}
                        disabled={isPending}
                        title="Delete Movie"
                        className="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white p-2.5 rounded-xl border border-rose-500/20 transition-all disabled:opacity-50 ml-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}