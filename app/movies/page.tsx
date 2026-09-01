"use client";

import { useState, useEffect, useTransition } from "react";

export default function MoviePickerPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedMovies, setSavedMovies] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Theme state (True = Dark Mode, False = Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");

  const [randomMovie, setRandomMovie] = useState<any | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  // Movie Details Modal state
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  async function executeSearch(searchTerm: string, page: number) {
    if (!searchTerm) return;

    setLoadingSearch(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(searchTerm)}&page=${page}&apikey=8618664a`);
      const data = await response.json();
      
      if (data.Response === "True") {
        setSearchResults(data.Search || []);
        setTotalResults(parseInt(data.totalResults) || 0);
      } else {
        setSearchResults([]);
        setTotalResults(0);
      }
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoadingSearch(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    setCurrentSearchTerm(query);
    setCurrentPage(1);
    executeSearch(query, 1);
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
    executeSearch(currentSearchTerm, newPage);
  }

  async function handleFetchDetails(imdbID: string) {
    setLoadingDetails(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=8618664a`);
      const data = await response.json();
      if (data.Response === "True") {
        setSelectedMovieDetail(data);
      }
    } catch (error) {
      console.error("Details fetch error", error);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleAddMovie(movie: any) {
    try {
      const response = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=8618664a`);
      const details = await response.json();

      startTransition(async () => {
        const saveRes = await fetch("/api/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: details.Title || movie.Title,
            year: details.Year || movie.Year,
            genre: details.Genre || movie.Type || "Movie",
            poster: details.Poster !== "N/A" ? details.Poster : "",
            director: details.Director || "N/A",
            actors: details.Actors || "N/A",
            plot: details.Plot || "N/A",
            runtime: details.Runtime || "N/A",
            imdbRating: details.imdbRating || "N/A",
          }),
        });

        if (saveRes.ok) {
          const newMovie = await saveRes.json();
          setSavedMovies((prev) => {
            if (prev.some((m) => m._id === newMovie._id)) return prev;
            return [newMovie, ...prev];
          });
        }
      });
    } catch (error) {
      console.error("Add movie error", error);
    }
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

  const totalPages = Math.ceil(totalResults / 10);

  return (
    <main className={`min-h-screen p-4 sm:p-6 lg:p-8 relative transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center bg-transparent pb-4 border-b border-slate-700/30">
          <div className="space-y-1">
            <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
               Movie Picker
            </h1>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Search movies and manage your collection.
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl transition-colors border flex items-center justify-center ${
              isDarkMode 
                ? "bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              /* Sun Icon for Dark Mode (Click to go Light) */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              /* Moon Icon for Light Mode (Click to go Dark) */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Search & Results */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleSearchSubmit} className={`flex gap-3 p-2.5 rounded-xl border shadow-lg ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies (e.g., Avatar, Matrix)..."
                className={`flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm ${isDarkMode ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
              />
              <button
                type="submit"
                disabled={loadingSearch}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loadingSearch ? "Searching..." : "Search"}
              </button>
            </form>

            <div className={`p-5 rounded-xl border shadow-lg space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-lg font-semibold ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                  Search Results
                </h2>
                {totalResults > 0 && (
                  <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Total: {totalResults} found
                  </span>
                )}
              </div>

              {searchResults.length === 0 ? (
                <div className={`text-center py-16 space-y-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  <p className="text-sm">Type a movie name above to search.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                    {searchResults.map((movie: any) => (
                      <div
                        key={movie.imdbID}
                        className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div 
                          onClick={() => handleFetchDetails(movie.imdbID)}
                          className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden"
                        >
                          {movie.Poster !== "N/A" ? (
                            <img src={movie.Poster} alt={movie.Title} className="w-12 h-16 object-cover rounded shadow" />
                          ) : (
                            <div className={`w-12 h-16 rounded flex items-center text-[10px] justify-center text-center ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"}`}>
                              No Image
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <h3 className={`font-bold text-sm truncate max-w-[180px] transition-colors ${isDarkMode ? "text-slate-200 hover:text-indigo-300" : "text-slate-800 hover:text-indigo-600"}`}>{movie.Title}</h3>
                            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{movie.Year} • <span className={`uppercase text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"}`}>{movie.Type}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMovie(movie)}
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ml-2"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className={`flex justify-between items-center pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loadingSearch}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors border ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm"}`}
                      >
                        Previous
                      </button>
                      <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loadingSearch}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors border ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm"}`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side: Saved Movies & Random Picker Button */}
          <div className="lg:col-span-6 space-y-4">
            
            {savedMovies.length > 0 && (
              <button
                onClick={handlePickRandomMovie}
                disabled={isPicking}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-colors text-base"
              >
                {isPicking ? "Picking a movie..." : "Pick a Movie For Me"}
              </button>
            )}

            <div className={`p-6 rounded-xl border shadow-lg space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className={`flex justify-between items-center border-b pb-3 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                <h2 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                  My Watchlist Collection
                </h2>
                <span className={`border px-3 py-0.5 rounded-full text-xs font-bold ${isDarkMode ? "bg-slate-800 text-indigo-300 border-slate-700" : "bg-slate-100 text-indigo-600 border-slate-300"}`}>
                  {savedMovies.length} Saved
                </span>
              </div>

              {savedMovies.length === 0 ? (
                <div className={`text-center py-24 space-y-2 flex flex-col justify-center items-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  <p className="text-sm">No movies saved in your collection yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {savedMovies.map((movie: any) => (
                    <div
                      key={movie._id}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-colors ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded shadow" />
                        ) : (
                          <div className={`w-14 h-20 rounded flex items-center text-[10px] justify-center text-center ${isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"}`}>
                            No Image
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className={`font-bold text-sm truncate max-w-[200px] sm:max-w-[280px] ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{movie.title}</h3>
                          <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Genre: <span className={isDarkMode ? "text-indigo-300" : "text-indigo-600"}>{movie.genre}</span></p>
                          <div className="flex gap-2 mt-2">
                            {movie.imdbRating && (
                              <span className={`text-[10px] border px-2 py-0.5 rounded ${isDarkMode ? "bg-amber-950/60 text-amber-300 border-amber-800/50" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                IMDb: {movie.imdbRating}
                              </span>
                            )}
                            {movie.runtime && (
                              <span className={`text-[10px] px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                                {movie.runtime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
  onClick={() => handleDeleteMovie(movie._id)}
  disabled={isPending}
  title="Delete Movie"
  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ml-2 ${
    isDarkMode
      ? "bg-rose-900/40 hover:bg-rose-700 text-rose-300 hover:text-white border-rose-800"
      : "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200"
  }`}
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
          <div className={`border p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6 relative ${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-900"}`}>
            <button
              onClick={() => setRandomMovie(null)}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm font-bold ${isDarkMode ? "text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700" : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"}`}
            >
              X
            </button>

            <div className="space-y-1">
              <span className={`text-xs uppercase tracking-widest font-bold ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>Selected Just For You</span>
              <h3 className="text-2xl font-bold">{randomMovie.title}</h3>
            </div>

            <div className="flex justify-center">
              {randomMovie.poster ? (
                <img src={randomMovie.poster} alt={randomMovie.title} className={`w-44 h-64 object-cover rounded-xl shadow-lg border ${isDarkMode ? "border-slate-700" : "border-slate-200"}`} />
              ) : (
                <div className={`w-44 h-64 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                  No Poster Available
                </div>
              )}
            </div>

            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Genre: <span className={`font-semibold ${isDarkMode ? "text-indigo-300" : "text-indigo-600"}`}>{randomMovie.genre}</span></p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePickRandomMovie}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors text-sm border ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"}`}
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

      {/* Movie Details Modal */}
      {selectedMovieDetail && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className={`border p-6 sm:p-8 rounded-2xl max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto ${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-900"}`}>
            <button
              onClick={() => setSelectedMovieDetail(null)}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm font-bold ${isDarkMode ? "text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700" : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"}`}
            >
              X
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {selectedMovieDetail.Poster !== "N/A" ? (
                <img src={selectedMovieDetail.Poster} alt={selectedMovieDetail.Title} className={`w-48 h-72 sm:w-56 sm:h-80 object-cover rounded-xl shadow-xl border flex-shrink-0 ${isDarkMode ? "border-slate-700" : "border-slate-200"}`} />
              ) : (
                <div className={`w-48 h-72 sm:w-56 sm:h-80 rounded-xl flex items-center text-sm justify-center flex-shrink-0 ${isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                  No Poster Available
                </div>
              )}
              
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-bold">{selectedMovieDetail.Title}</h3>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{selectedMovieDetail.Year} • {selectedMovieDetail.Runtime} • {selectedMovieDetail.Rated}</p>
                <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                  {selectedMovieDetail.Genre?.split(", ").map((g: string, i: number) => (
                    <span key={i} className={`text-[10px] border px-2 py-0.5 rounded ${isDarkMode ? "bg-indigo-950 text-indigo-300 border-indigo-800/50" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                      {g}
                    </span>
                  ))}
                </div>
                {selectedMovieDetail.imdbRating && (
                  <div className={`pt-1 text-sm font-semibold ${isDarkMode ? "text-amber-300" : "text-amber-600"}`}>
                    IMDb Rating: {selectedMovieDetail.imdbRating} / 10
                  </div>
                )}

                <div className={`space-y-2 text-sm border-t pt-3 text-left ${isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-700"}`}>
                  <p><strong className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Plot:</strong> {selectedMovieDetail.Plot}</p>
                  <p><strong className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Director:</strong> {selectedMovieDetail.Director}</p>
                  <p><strong className={isDarkMode ? "text-slate-400" : "text-slate-600"}>Cast:</strong> {selectedMovieDetail.Actors}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedMovieDetail(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors text-sm shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </main>
  );
}