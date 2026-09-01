"use client";

import { useState, useEffect, useTransition } from "react";

export default function MoviePickerPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedMovies, setSavedMovies] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingSearch, setLoadingSearch] = useState(false);

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

  function handlePickRandomMovie() {
    if (savedMovies.length === 0) return;
    
    setIsPicking(true);
    setRandomMovie(null);

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
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Movie Picker
          </h1>
          <p className="text-slate-400 text-sm">Search movies and pick what to watch from your collection.</p>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Search & Results */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleSearch} className="flex gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-lg">
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loadingSearch ? "Searching..." : "Search"}
              </button>
            </form>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
              <h2 className="text-lg font-semibold text-indigo-400">
                Search Results ({searchResults.length})
              </h2>

              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <p className="text-sm">Type a movie name above to search.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {searchResults.map((movie: any) => (
                    <div
                      key={movie.imdbID}
                      className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {movie.Poster !== "N/A" ? (
                          <img src={movie.Poster} alt={movie.Title} className="w-12 h-16 object-cover rounded shadow" />
                        ) : (
                          <div className="w-12 h-16 bg-slate-700 rounded flex items-center text-[10px] text-slate-400 justify-center text-center">
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        Add
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
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-colors text-base"
              >
                {isPicking ? "Picking a movie..." : "Pick a Movie For Me"}
              </button>
            )}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-slate-100">
                  My Watchlist Collection
                </h2>
                <span className="bg-slate-800 text-indigo-300 border border-slate-700 px-3 py-0.5 rounded-full text-xs font-bold">
                  {savedMovies.length} Saved
                </span>
              </div>

              {savedMovies.length === 0 ? (
                <div className="text-center py-24 text-slate-500 space-y-2 flex flex-col justify-center items-center">
                  <p className="text-sm">No movies saved in your collection yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {savedMovies.map((movie: any) => (
                    <div
                      key={movie._id}
                      className="flex items-center justify-between p-3.5 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded shadow" />
                        ) : (
                          <div className="w-14 h-20 bg-slate-700 rounded flex items-center text-[10px] text-slate-400 justify-center text-center">
                            No Image
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-100 text-sm truncate max-w-[200px] sm:max-w-[280px]">{movie.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">Genre: <span className="text-indigo-300">{movie.genre}</span></p>
                          <span className="inline-block mt-2 text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                            Saved in Vault
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMovie(movie._id)}
                        disabled={isPending}
                        title="Delete Movie"
                        className="bg-rose-900/40 hover:bg-rose-700 text-rose-300 hover:text-white px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-800 transition-colors disabled:opacity-50 ml-2"
                      >
                        Delete
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
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6 relative">
            
            <button
              onClick={() => setRandomMovie(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
            >
              X
            </button>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Selected Just For You</span>
              <h3 className="text-2xl font-bold text-slate-100">{randomMovie.title}</h3>
            </div>

            <div className="flex justify-center">
              {randomMovie.poster ? (
                <img src={randomMovie.poster} alt={randomMovie.title} className="w-44 h-64 object-cover rounded-xl shadow-lg border border-slate-700" />
              ) : (
                <div className="w-44 h-64 bg-slate-800 rounded-xl flex items-center text-slate-500 justify-center">
                  No Poster Available
                </div>
              )}
            </div>

            <p className="text-sm text-slate-400">Genre: <span className="text-indigo-300 font-semibold">{randomMovie.genre}</span></p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePickRandomMovie}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-lg font-medium transition-colors text-sm border border-slate-700"
              >
                Pick Another
              </button>
              <button
                onClick={() => setRandomMovie(null)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors text-sm shadow-lg"
              >
                Let's Watch
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}