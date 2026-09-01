"use client";

import { useState, useEffect, useTransition } from "react";

export default function MoviePickerPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedMovies, setSavedMovies] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Random Picker සඳහා අවශ්‍ය states
  const [randomMovie, setRandomMovie] = useState<any | null>(null);
  const [isPicking, setIsPicking] = useState(false);

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

  // අහඹු ලෙස මූවි එකක් තෝරන ෆන්ෂන් එක
  function handlePickRandomMovie() {
    if (savedMovies.length === 0) return;
    
    setIsPicking(true);
    setRandomMovie(null);

    // පොඩි ඇනිමේෂන් ලුක් එකක් දෙන්න ටයිමර් එකක් පාවිච්චි කරමු
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * savedMovies.length);
      setRandomMovie(savedMovies[randomIndex]);
      setIsPicking(false);
    }, 600);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            🎬 CineVault Movie Picker
          </h1>
          <p className="text-slate-400 text-sm">Search movies from OMDb on the left and pick what to watch from your collection on the right.</p>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Search & Results */}
          <div className="lg:col-span-6 space-y-6">
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

            <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <h2 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                <span>⚡</span> Search Results ({searchResults.length})
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

          {/* Right Side: Saved Movies & Random Picker Button */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Pick Random Movie Button */}
            {savedMovies.length > 0 && (
              <button
                onClick={handlePickRandomMovie}
                disabled={isPicking}
                className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-pink-600/20 transition-all flex items-center justify-center gap-2 text-base active:scale-[0.99]"
              >
                <span>🎲</span> {isPicking ? "Picking a movie..." : "Pick a Movie For Me!"}
              </button>
            )}

            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📚</span> My Watchlist Collection
                </h2>
                <span className="bg-purple-950 text-purple-300 border border-purple-800/50 px-3 py-0.5 rounded-full text-xs font-bold">
                  {savedMovies.length} Saved
                </span>
              </div>

              {savedMovies.length === 0 ? (
                <div className="text-center py-24 text-slate-500 space-y-2 flex flex-col justify-center items-center">
                  <p className="text-4xl">🍿</p>
                  <p className="text-sm">No movies saved in your collection yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
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

      {/* Random Movie Popup Modal */}
      {randomMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/30 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6 relative">
            
            {/* Close Button */}
            <button
              onClick={() => setRandomMovie(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-pink-400 font-bold">Selected Just For You 🎉</span>
              <h3 className="text-2xl font-black text-slate-100">{randomMovie.title}</h3>
            </div>

            {/* Poster */}
            <div className="flex justify-center">
              {randomMovie.poster ? (
                <img src={randomMovie.poster} alt={randomMovie.title} className="w-44 h-64 object-cover rounded-2xl shadow-2xl border border-slate-700" />
              ) : (
                <div className="w-44 h-64 bg-slate-800 rounded-2xl flex items-center text-slate-500 justify-center">
                  No Poster Available
                </div>
              )}
            </div>

            <p className="text-sm text-slate-400">Genre: <span className="text-purple-300 font-semibold">{randomMovie.genre}</span></p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePickRandomMovie}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-medium transition-all text-sm border border-slate-700"
              >
                Pick Another 🎲
              </button>
              <button
                onClick={() => setRandomMovie(null)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-bold transition-all text-sm shadow-lg shadow-purple-600/20"
              >
                Let's Watch! 🍿
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}