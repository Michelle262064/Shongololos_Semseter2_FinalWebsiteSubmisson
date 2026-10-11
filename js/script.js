// Core object class
class Movie {
  constructor(_title, _rating, _image, _backdrop = "", _overview = "", _genres = [], _id = null) {
    this.title = _title;
    this.rating = _rating;
    this.image = _image;
    this.backdrop = _backdrop;
    this.overview = _overview;
    this.genres = _genres; 
    this.id = _id;    
  }
}

const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE_342: "https://image.tmdb.org/t/p/w342",
  IMAGE_BASE_1280: "https://image.tmdb.org/t/p/w1280"
};

// Category button text -> TMDB genre id ("all" has no id)
const GENRE_IDS = { comedy: 35, drama: 18, action: 28, horror: 27 };

// Offline fallback so the site still demos without an API key / network
const FALLBACK_MOVIES = [
  new Movie("Project Hail Mary", 8.8, "", "", "A solitary astronaut must save humanity from an impending stellar extinction event.", [878, 18]),
  new Movie("Slow Horses", 8.5, "", "", "Slough House MI5 agents navigate deep tactical espionage across modern London.", [18, 28]),
  new Movie("Spider-Man: Brand New Day", 8.4, "", "", "Peter Parker returns in an all-new adventure.", [28]),
  new Movie("Coyote vs. Acme", 8.1, "", "", "The trial of the century comes alive on screen.", [35]),
  new Movie("Resident Evil", 7.9, "", "", "Survival horror takes on a completely new framework.", [27, 28])
];

function hasToken() {
  return typeof TMDB_TOKEN !== "undefined" && !TMDB_TOKEN.startsWith("PASTE_");
}

// One helper for every TMDB request (accepts the long Read Access Token or the short API Key)
async function tmdbGet(path, params = {}) {
  const key = TMDB_TOKEN.trim();
  const url = new URL(TMDB_CONFIG.BASE_URL + path);
  Object.entries({ language: "en-US", include_adult: "false", ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = { accept: "application/json" };
  if (key.length < 60) url.searchParams.set("api_key", key);
  else headers.Authorization = `Bearer ${key}`;
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function toMovie(m) {
  return new Movie(
    m.title,
    m.vote_average,
    m.poster_path ? TMDB_CONFIG.IMAGE_BASE_342 + m.poster_path : "",
    m.backdrop_path ? TMDB_CONFIG.IMAGE_BASE_1280 + m.backdrop_path : "",
    m.overview,
    m.genre_ids || [],
    m.id
  );
}

function filterLocal(list, genreId, query) {
  const q = query.toLowerCase();
  return list.filter(m =>
    (!genreId || m.genres.includes(genreId)) &&
    (!q || m.title.toLowerCase().includes(q))
  );
}

// Genre: "all" | "comedy" | "drama" | "action" | "horror";  query: search text
async function loadMovies({ genre = "all", query = "" } = {}) {
  const genreId = GENRE_IDS[genre];
  if (!hasToken()) return filterLocal(FALLBACK_MOVIES, genreId, query);
  try {
    let data;
    if (query) {
      data = await tmdbGet("/search/movie", { query, page: 1 });
    } else {
      data = await tmdbGet("/discover/movie", {
        include_video: "false",
        sort_by: "popularity.desc",
        page: 1,
        ...(genreId ? { with_genres: genreId } : {})
      });
    }
    let list = (data.results || []).map(toMovie);
    if (query && genreId) list = list.filter(m => m.genres.includes(genreId));
    return list;
  } catch (err) {
    console.error("API request failed, using fallback data:", err);
    return filterLocal(FALLBACK_MOVIES, genreId, query);
  }
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Save the clicked movie, then open the individual movie page (media.html reads this key)
function openMovie(movie) {
  try { localStorage.setItem("streamlineSelectedMovie", JSON.stringify(movie)); } catch {}
  window.location.href = "media.html"; // all pages live in /pages/
}

// WATCHLIST: saved in localStorage so watchlist.html can read it.
// Key "streamlineWatchlist" holds an array of movie objects, newest first 
// (id, title, rating, image, backdrop, overview, genres)
const WATCHLIST_KEY = "streamlineWatchlist";

function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []; } catch { return []; }
}

// Unique key per movie (TMDB id when we have one, title for the offline fallback movies)
const movieKey = m => (m.id ? "id:" + m.id : "title:" + m.title);

function isInWatchlist(movie) {
  const key = movieKey(movie);
  return getWatchlist().some(m => movieKey(m) === key);
}

// Adds the movie if it isn't saved yet, removes it if it is. Returns true when it was added.
function toggleWatchlist(movie) {
  const key = movieKey(movie);
  let list = getWatchlist();
  const exists = list.some(m => movieKey(m) === key);
  list = exists ? list.filter(m => movieKey(m) !== key) : [movie, ...list];
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list)); } catch {}
  refreshWatchlistButtons();
  if (!exists) {
    // yellow glow pulse on the bookmark of the movie that was just added
    document.querySelectorAll(".watchlist-btn").forEach(btn => {
      if (btn.dataset.key !== key) return;
      btn.classList.remove("pulse");
      void btn.offsetWidth; // restart the animation if it is clicked again quickly
      btn.classList.add("pulse");
      btn.addEventListener("animationend", () => btn.classList.remove("pulse"), { once: true });
    });
  }
  return !exists;
}

// Keeps every bookmark icon on the page in sync with what is saved
function refreshWatchlistButtons() {
  const saved = new Set(getWatchlist().map(movieKey));
  document.querySelectorAll(".watchlist-btn").forEach(btn => {
    const on = saved.has(btn.dataset.key);
    btn.classList.toggle("saved", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? "Remove from Watch List" : "Add to Watch List";
    btn.innerHTML = `<i class="${on ? "fa-solid" : "fa-regular"} fa-bookmark"></i>`;
  });
}

// One click handler for every poster grid
function handleCardClick(e, getMovie) {
  const card = e.target.closest(".dashboard-movie-card");
  if (!card) return;
  const movie = getMovie(Number(card.dataset.index));
  if (!movie) return;
  if (e.target.closest(".watchlist-btn")) { toggleWatchlist(movie); return; }
  openMovie(movie);
}

// Hero slider
function renderHero(movies) {
  const inner = document.getElementById("carouselInner");
  const dots = document.getElementById("carouselIndicators");
  if (!inner) return;
  inner.innerHTML = "";
  if (dots) dots.innerHTML = "";

  movies.slice(0, 5).forEach((movie, i) => {
    const bg = movie.backdrop
      ? `linear-gradient(to top, rgba(20,20,20,1) 5%, rgba(20,20,20,.4) 50%, rgba(20,20,20,.1) 100%), url('${movie.backdrop}')`
      : `linear-gradient(to top, rgba(20,20,20,1) 5%, rgba(0,128,255,.25) 100%)`;

    const slide = document.createElement("div");
    slide.className = `carousel-item ${i === 0 ? "active" : ""}`;
    slide.style.cursor = "pointer";
    slide.innerHTML = `
      <div class="hero-overlay-info" style="background-image:${bg}">
        <h1 style="font-size:2.8rem;font-weight:700;text-shadow:0 2px 4px rgba(0,0,0,.8)">${escapeHTML(movie.title)}</h1>
        <p style="color:#F5C518;font-weight:600;font-size:1.1rem"><i class="fa-solid fa-star"></i> ${Number(movie.rating).toFixed(1)}/10</p>
        <p style="max-width:700px;color:#ddd;line-height:1.5">${escapeHTML(movie.overview || "No overview available.")}</p>
      </div>`;
    slide.addEventListener("click", () => openMovie(movie)); // hero banner opens the movie page too
    inner.appendChild(slide);

    if (dots) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("data-bs-target", "#carouselHero");
      dot.setAttribute("data-bs-slide-to", String(i));
      dot.setAttribute("aria-label", `Slide ${i + 1}`);
      if (i === 0) dot.className = "active";
      dots.appendChild(dot);
    }
  });
}

// Poster grids
function cardHTML(movie, index) {
  const poster = movie.image
    ? `<img src="${movie.image}" alt="${escapeHTML(movie.title)}" loading="lazy">`
    : `<div class="poster-fallback">${escapeHTML(movie.title)}</div>`;
  return `
    <div class="dashboard-movie-card" data-index="${index}" style="cursor:pointer">
      <button type="button" class="watchlist-btn" data-key="${escapeHTML(movieKey(movie))}" aria-label="Add to Watch List"></button>
      ${poster}
      <h5>${escapeHTML(movie.title)}</h5>
      <span><i class="fa-solid fa-star"></i> ${Number(movie.rating).toFixed(1)}</span>
    </div>`;
}

function renderGrid(container, movies, emptyHTML) {
  container.innerHTML = movies.length
    ? movies.map(cardHTML).join("")
    : `<p class="empty-note">${emptyHTML}</p>`;
  refreshWatchlistButtons();
}

// Scroll paddles
function initPaddles() {
  document.querySelectorAll(".horizontal-scroll-wrapper").forEach(wrapper => {
    const viewport = wrapper.querySelector(".poster-grid-viewport");
    const right = wrapper.querySelector(".right-paddle");
    const left = wrapper.querySelector(".left-paddle");
    if (!viewport || !right || !left) return;
    right.onclick = () => viewport.scrollBy({ left: 360, behavior: "smooth" });
    left.onclick = () => viewport.scrollBy({ left: -360, behavior: "smooth" });
  });
}

// StreamLine navbar "User" section.
// The login / sign up page (index.html) saves the user in localStorage under "streamlineUser".
// Logged out -> navbar shows "Login" and "Sign Up".
// Logged in  -> those two are replaced by a "User" pill (avatar + name) that links back to /index.html.
(function () {
  if (window.StreamLineAuth) return; // already loaded (script.js also loads this file)

  const USER_KEY = "streamlineUser";

  const escapeText = str => String(str == null ? "" : str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }

  // Call this from index.html after a successful login / sign up
  function login(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user || { name: "User" })); } catch {}
    renderUserNav();
  }

  function logout() {
    try { localStorage.removeItem(USER_KEY); } catch {}
    renderUserNav();
  }

  function renderUserNav() {
    const menu = document.querySelector(".menu-inner");
    if (!menu) return; // this page has no navbar menu

    menu.querySelectorAll(".user-menu-item").forEach(el => el.remove());

    // The existing "Login" and "Sign Up" nav items
    const authItems = [...menu.querySelectorAll(".menu-item")].filter(li => {
      const a = li.querySelector("a");
      const text = a ? a.textContent.trim().toLowerCase() : "";
      return text === "login" || text === "sign up";
    });

    const user = getUser();
    if (!user) {
      authItems.forEach(li => { li.style.display = ""; });
      return;
    }

    authItems.forEach(li => { li.style.display = "none"; });

    // Works with a saved name or straight Firebase fields (displayName / email)
    const emailName = user.email ? String(user.email).split("@")[0] : "";
    const name = String(user.name || user.displayName || user.username || emailName || "User").trim() || "User";
    const li = document.createElement("li");
    li.className = "menu-item user-menu-item";
    li.innerHTML = `
      <a href="/index.html" class="menu-link user-link d-flex align-items-center gap-2 text-decoration-none" title="Signed in as ${escapeText(name)}">
        <span class="user-avatar">${escapeText(name.charAt(0).toUpperCase())}</span>
        <span class="user-name">${escapeText(name)}</span>
      </a>`;
    menu.appendChild(li);
  }

  window.StreamLineAuth = { getUser, login, logout, render: renderUserNav };

  // Keep the navbar right if the user logs in / out in another tab
  window.addEventListener("storage", e => { if (e.key === USER_KEY) renderUserNav(); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderUserNav);
  else renderUserNav();
})();

// Main
(async function () {
  let baseMovies = await loadMovies();
  if (!baseMovies.length) baseMovies = FALLBACK_MOVIES;

  const addedGrid = document.getElementById("recentlyAddedGrid");
  const watchedGrid = document.getElementById("recentlyWatchedGrid");

  renderHero(baseMovies);
  initPaddles();

  let currentList = baseMovies;
  let genre = "all";
  let query = "";
  let requestId = 0;

  // "Watched" list: full movie objects saved in localStorage
  let watched;
  try { watched = JSON.parse(localStorage.getItem("streamlineWatchedV2")) || []; } catch { watched = []; }
  if (!watched.length) watched = [...baseMovies].reverse().slice(0, 5);

  function renderWatched() {
    if (watchedGrid) renderGrid(watchedGrid, watched, "Nothing watched yet.");
  }

  // Reload "Recently Added" for the current category + search text
  async function applyFilters() {
    if (!addedGrid) return;
    const id = ++requestId;
    addedGrid.innerHTML = `<p class="empty-note">Loading...</p>`;
    const list = await loadMovies({ genre, query });
    if (id !== requestId) return; // a newer search finished first
    currentList = list;
    renderGrid(
      addedGrid,
      list,
      query ? `No results for "${escapeHTML(query)}".` : "No movies in this category."
    );
  }

  if (addedGrid) renderGrid(addedGrid, currentList, "No movies found.");
  renderWatched();

  if (addedGrid) addedGrid.addEventListener("click", e => handleCardClick(e, i => currentList[i]));  // Click a poster card -> open its movie page (media.js adds it to "Recently Watched" itself)
  if (watchedGrid) watchedGrid.addEventListener("click", e => handleCardClick(e, i => watched[i])); // Click the bookmark icon on a card -> add / remove it from the Watch List


  // "Show more" links: open the library page, the same way a search does
  // The row it came from (and the chosen category) is passed along so the library page can use it
  document.querySelectorAll(".show-more-btn, .show-more-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const grid = link.closest("section")?.querySelector(".poster-grid-viewport");
      const params = new URLSearchParams();
      if (!grid) params.set("section", "categories");
      else if (grid.id === "recentlyWatchedGrid") params.set("section", "recently-watched");
      else params.set("section", "recently-added");
      if (grid && grid.id === "recentlyAddedGrid" && genre !== "all") params.set("genre", genre);
      window.location.href = `library.html?${params.toString()}`;
    });
  });

  // Category filters: finds the buttons by their text 
  const validNames = ["all", ...Object.keys(GENRE_IDS)];
  const categoryButtons = [...new Set(
    [...document.querySelectorAll("button, a, li, span, div")]
      .filter(el => el.children.length === 0 && validNames.includes(el.textContent.trim().toLowerCase()))
      .map(el => el.closest("button, a, li") || el)
  )];

  categoryButtons.forEach(btn => {
    btn.style.cursor = "pointer";
    btn.addEventListener("click", e => {
      e.preventDefault();
      genre = btn.textContent.trim().toLowerCase();
      categoryButtons.forEach(b => b.classList.toggle("active", b === btn));
      applyFilters();
    });
  });

  // Search bar logic: suggestions dropdown while typing; Enter / magnifier / suggestion click opens library.html
  const searchInput =
    document.getElementById("searchInput") ||
    document.querySelector('input[type="search"]') ||
    document.querySelector('input[placeholder*="search" i]');

  if (searchInput) {
    // Dropdown styles live here so no CSS edits are needed
    const style = document.createElement("style");
    style.textContent = `
      .sl-suggest-item{display:flex;gap:10px;align-items:center;padding:8px 12px;cursor:pointer;color:#fff}
      .sl-suggest-item:hover{background:#2B2B2B}
      .sl-suggest-empty{padding:10px 12px;color:#A3A3A3}
    `;
    document.head.appendChild(style);

    const host = searchInput.closest(".search") || searchInput.parentElement;
    host.style.position = "relative";
    const box = document.createElement("div");
    box.id = "searchSuggestions";
    box.style.cssText =
      "position:absolute;top:100%;left:0;right:0;z-index:2000;background:#1F1F1F;border:1px solid #2B2B2B;" +
      "border-radius:8px;margin-top:6px;overflow:hidden;display:none;box-shadow:0 10px 24px rgba(0,0,0,.5);";
    host.appendChild(box);

    let suggestList = [];
    let suggestId = 0;
    let suggestTimer;
    const hideSuggestions = () => { box.style.display = "none"; };

    async function showSuggestions(text) {
      const id = ++suggestId;
      const list = (await loadMovies({ query: text })).slice(0, 6);
      if (id !== suggestId) return; 
      suggestList = list;
      box.innerHTML = list.length
        ? list.map((m, i) => `
            <div class="sl-suggest-item" data-i="${i}">
              ${m.image
                ? `<img src="${m.image}" alt="" style="width:36px;height:54px;object-fit:cover;border-radius:4px">`
                : `<div style="width:36px;height:54px;background:#2B2B2B;border-radius:4px"></div>`}
              <div>
                <div>${escapeHTML(m.title)}</div>
                <small style="color:#F5C518">&#9733; ${Number(m.rating).toFixed(1)}</small>
              </div>
            </div>`).join("")
        : `<div class="sl-suggest-empty">No matches for "${escapeHTML(text)}"</div>`;
      box.style.display = "block";
    }

    // Full search: opens the library page with the results
    const runSearch = () => {
      clearTimeout(suggestTimer);
      suggestId++;
      hideSuggestions();
      const text = searchInput.value.trim();
      if (!text) return;
      window.location.href = `library.html?search=${encodeURIComponent(text)}`;
    };

    searchInput.addEventListener("input", () => {
      clearTimeout(suggestTimer);
      const text = searchInput.value.trim();
      if (text.length < 2) {
        suggestId++;
        hideSuggestions();
        return;
      }
      suggestTimer = setTimeout(() => showSuggestions(text), 250);
    });

    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); runSearch(); }
      if (e.key === "Escape") hideSuggestions();
    });

    box.addEventListener("click", e => {
      const item = e.target.closest(".sl-suggest-item");
      if (!item) return;
      const movie = suggestList[Number(item.dataset.i)];
      if (!movie) return;
      searchInput.value = movie.title;
      runSearch();
    });

    document.addEventListener("click", e => { if (!host.contains(e.target)) hideSuggestions(); });

    const form = searchInput.closest("form");
    if (form) {
      form.addEventListener("submit", e => { e.preventDefault(); runSearch(); });
    } else {
      const searchBtn = host.querySelector("button, .fa-magnifying-glass, .fa-search");
      if (searchBtn) searchBtn.addEventListener("click", e => { e.preventDefault(); runSearch(); });
    }
  }
})();

//Ari
document.addEventListener('DOMContentLoaded', () => {
    const signinSection = document.getElementById('signinSection');
    const signupSection = document.getElementById('signupSection');
    const showSignupBtn = document.getElementById('showSignup');
    const showSigninBtn = document.getElementById('showSignin');

    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signinSection.classList.add('hidden');
            signupSection.classList.remove('hidden');
        });
    }

    if (showSigninBtn) {
        showSigninBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupSection.classList.add('hidden');
            signinSection.classList.remove('hidden');
        });
    }

    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Sign In form submitted');
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Sign Up form submitted');
        });
    }

    const watchlistGrid = document.getElementById('watchlistGrid');
    
    if (!watchlistGrid) return;

    const savedWatchlist = JSON.parse(localStorage.getItem('streamlineWatchlist')) || [];

    if (savedWatchlist.length === 0) {
        watchlistGrid.innerHTML = `<p class="empty-msg">Your watchlist is empty. Go explore some movies!</p>`;
        return;
    }

    watchlistGrid.innerHTML = '';

    savedWatchlist.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('movie-card');

        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : '../assets/img/placeholder.png';

        card.innerHTML = `
            <img src="${posterUrl}" alt="${movie.title}">
            <div class="card-info">
                <h3>${movie.title}</h3>
                <p>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'} • Interactive</p>
                <button class="remove-btn" data-id="${movie.id}">Remove</button>
            </div>
        `;

        const removeBtn = card.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            removeFromWatchlist(movie.id);
        });

        watchlistGrid.appendChild(card);
    });
});

