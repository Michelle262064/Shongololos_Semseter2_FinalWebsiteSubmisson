// StreamLine movie page: reads the movie saved in localStorage by the poster click)
const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  IMG: "https://image.tmdb.org/t/p/"
};

// The poster click on the homepage / library saves the chosen movie here before opening media.html
const SELECTED_KEY = "streamlineSelectedMovie";

const GENRE_NAMES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary",
  18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction", 10770: "TV Movie", 53: "Thriller",
  10752: "War", 37: "Western"
};

function readSelected() {
  try { return JSON.parse(localStorage.getItem(SELECTED_KEY)); } catch { return null; }
}

const pathFromUrl = url => (url ? url.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)/, "") : "");

// Turns the saved poster-card data into the same shape the TMDB details call returns
function basicToDetails(m) {
  return {
    id: m.id || null,
    title: m.title,
    vote_average: m.rating || 0,
    overview: m.overview || "",
    poster_path: pathFromUrl(m.image),
    backdrop_path: pathFromUrl(m.backdrop),
    genres: (m.genres || []).map(id => ({ id, name: GENRE_NAMES[id] })).filter(g => g.name)
  };
}

function hasToken() {
  return typeof TMDB_TOKEN !== "undefined" && !TMDB_TOKEN.startsWith("PASTE_");
}

async function tmdbGet(path, params = {}) {
  const key = TMDB_TOKEN.trim();
  const url = new URL(TMDB_CONFIG.BASE_URL + path);
  Object.entries({ language: "en-US", ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = { accept: "application/json" };
  if (key.length < 60) url.searchParams.set("api_key", key); 
  else headers.Authorization = `Bearer ${key}`;              
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function escapeHTML(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const img = (path, size) => (path ? TMDB_CONFIG.IMG + size + path : "");
const $ = id => document.getElementById(id);

function formatRuntime(mins) {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(str) {
  if (!str) return "";
  const date = new Date(str + "T00:00:00");
  return isNaN(date) ? str : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const money = n => (n > 0 ? "$" + Number(n).toLocaleString("en-US") : "");

// 10 stars, filled to match the /10 rating
function starsHTML(rating) {
  let out = "";
  for (let i = 1; i <= 10; i++) {
    if (rating >= i - 0.25) out += `<i class="ratingStar fa-solid fa-star text-warning"></i>`;
    else if (rating >= i - 0.75) out += `<i class="ratingStar fa-solid fa-star-half-stroke text-warning"></i>`;
    else out += `<i class="ratingStar fa-regular fa-star text-secondary"></i>`;
  }
  return out;
}

const row = (label, valueHTML) => valueHTML ? `
  <div class="mediaRow row g-2 py-2">
    <div class="mediaLabel col-12 col-sm-3 col-xl-2 fw-semibold">${label}</div>
    <div class="mediaValue col-12 col-sm-9 col-xl-10">${valueHTML}</div>
  </div>` : "";

// Title, genres, backdrop
function renderHeader(d) {
  const year = d.release_date ? d.release_date.slice(0, 4) : "";
  $("mediaTitle").innerHTML = `${escapeHTML(d.title)}${year ? ` <span class="mediaYear">(${year})</span>` : ""}`;
  $("mediaGenres").textContent = (d.genres || []).map(g => g.name).join(", ");
  if (d.backdrop_path) $("mediaBackdrop").style.backgroundImage = `url('${img(d.backdrop_path, "w1280")}')`;
  document.title = `${d.title}${year ? ` (${year})` : ""} | StreamLine`;
}

// Left column: poster + external link buttons
function renderLeft(d) {
  const poster = d.poster_path
    ? `<img class="mediaPoster img-fluid rounded" src="${img(d.poster_path, "w500")}" alt="${escapeHTML(d.title)} poster">`
    : `<div class="mediaPosterFallback rounded d-flex align-items-center justify-content-center text-center p-3 fw-semibold">${escapeHTML(d.title)}</div>`;

  const buttons = [
    d.imdb_id ? `<a class="mediaBtn btn btn-secondary btn-sm" href="https://www.imdb.com/title/${encodeURIComponent(d.imdb_id)}/" target="_blank" rel="noopener">IMDb</a>` : "",
    d.id ? `<a class="mediaBtn btn btn-secondary btn-sm" href="https://www.themoviedb.org/movie/${encodeURIComponent(d.id)}" target="_blank" rel="noopener">TMDB</a>` : ""
  ].join("");

  $("mediaLeft").innerHTML = `${poster}${buttons ? `<div class="mediaLinks d-flex gap-2 mt-3">${buttons}</div>` : ""}`;
}

// Right column: rating, director, cast, plot and the rest of the details
function renderRight(d) {
  const rating = Number(d.vote_average || 0);
  const votes = d.vote_count ? `${d.vote_count.toLocaleString("en-US")} Votes` : "";

  const ratingHTML = `
    <div class="ratingLine d-flex align-items-center flex-wrap gap-3">
      <span class="ratingStars">${starsHTML(rating)}</span>
      <span class="ratingScore">${rating.toFixed(1)}<small>/10</small></span>
      <span class="ratingVotes ms-auto">${votes}</span>
    </div>`;

  const crew = (d.credits && d.credits.crew) || [];
  const cast = ((d.credits && d.credits.cast) || []).slice(0, 12).map(c => c.name);
  const directors = [...new Set(crew.filter(c => c.job === "Director").map(c => c.name))];
  const writers = [...new Set(crew.filter(c => ["Writer", "Screenplay", "Story"].includes(c.job)).map(c => c.name))].slice(0, 4);
  const languages = (d.spoken_languages || []).map(l => l.english_name).filter(Boolean);
  const countries = (d.production_countries || []).map(c => c.name);

  $("mediaRight").innerHTML = [
    row("Rating", ratingHTML),
    row("Director", directors.length ? escapeHTML(directors.join(", ")) : ""),
    row("Writers", writers.length ? escapeHTML(writers.join(", ")) : ""),
    row("Cast", cast.length ? escapeHTML(cast.join(", ")) : ""),
    row("Tagline", d.tagline ? `<em>${escapeHTML(d.tagline)}</em>` : ""),
    row("Plot", escapeHTML(d.overview || "No description available.")),
    row("Released", escapeHTML(formatDate(d.release_date))),
    row("Runtime", escapeHTML(formatRuntime(d.runtime))),
    row("Language", escapeHTML(languages.join(", "))),
    row("Country", escapeHTML(countries.join(", "))),
    row("Status", escapeHTML(d.status || "")),
    row("Budget", escapeHTML(money(d.budget))),
    row("Revenue", escapeHTML(money(d.revenue)))
  ].join("");
}

// Filmstrip + Full-size Viewer
function initGallery(d) {
  const stills = ((d.images && d.images.backdrops) || []).slice(0, 40);
  const frames = stills.length ? stills : ((d.images && d.images.posters) || []).slice(0, 40);
  if (!frames.length) return;

  const strip = $("mediaFilmstrip");
  const thumbs = $("filmThumbs");
  const prevBtn = $("filmPrev");
  const nextBtn = $("filmNext");
  const counter = $("filmCounter");
  const perPage = () => (window.innerWidth < 576 ? 2 : window.innerWidth < 992 ? 4 : 6);
  let start = 0;

  function renderStrip() {
    const n = perPage();
    const end = Math.min(start + n, frames.length);
    thumbs.innerHTML = frames.slice(start, end).map((f, i) => `
      <button type="button" class="filmThumb" data-i="${start + i}" aria-label="Open image ${start + i + 1}">
        <img src="${img(f.file_path, "w300")}" alt="${escapeHTML(d.title)} image ${start + i + 1}" loading="lazy">
      </button>`).join("");
    counter.textContent = `${start + 1} - ${end} / ${frames.length}`;
    prevBtn.disabled = start === 0;
    nextBtn.disabled = end >= frames.length;
  }

  prevBtn.addEventListener("click", () => { start = Math.max(0, start - perPage()); renderStrip(); });
  nextBtn.addEventListener("click", () => { start = Math.min(frames.length - 1, start + perPage()); renderStrip(); });
  window.addEventListener("resize", renderStrip);
  strip.hidden = false;
  renderStrip();

  // Full-size viewer
  const box = $("lightbox");
  let current = 0;
  const showImage = i => {
    current = (i + frames.length) % frames.length;
    $("lightboxImg").src = img(frames[current].file_path, "original");
    $("lightboxImg").alt = `${d.title} image ${current + 1}`;
    $("lightboxCount").textContent = `${current + 1} / ${frames.length}`;
  };
  const openBox = i => { showImage(i); box.classList.remove("d-none"); box.classList.add("d-flex"); };
  const closeBox = () => { box.classList.add("d-none"); box.classList.remove("d-flex"); };

  thumbs.addEventListener("click", e => {
    const btn = e.target.closest(".filmThumb");
    if (btn) openBox(Number(btn.dataset.i));
  });
  $("lightboxClose").addEventListener("click", closeBox);
  $("lightboxPrev").addEventListener("click", () => showImage(current - 1));
  $("lightboxNext").addEventListener("click", () => showImage(current + 1));
  box.addEventListener("click", e => { if (e.target === box) closeBox(); });
  document.addEventListener("keydown", e => {
    if (box.classList.contains("d-none")) return;
    if (e.key === "Escape") closeBox();
    if (e.key === "ArrowLeft") showImage(current - 1);
    if (e.key === "ArrowRight") showImage(current + 1);
  });
}

// Opening a movie adds it to "Recently Watched" on the homepage 
function saveWatched(d) {
  const movie = {
    id: d.id || null,
    title: d.title,
    rating: d.vote_average || 0,
    image: d.poster_path ? img(d.poster_path, "w342") : "",
    backdrop: d.backdrop_path ? img(d.backdrop_path, "w1280") : "",
    overview: d.overview || "",
    genres: (d.genres || []).map(g => g.id)
  };
  let watched;
  try { watched = JSON.parse(localStorage.getItem("streamlineWatchedV2")) || []; } catch { watched = []; }
  watched = [movie, ...watched.filter(w => w.title !== movie.title)].slice(0, 10);
  try { localStorage.setItem("streamlineWatchedV2", JSON.stringify(watched)); } catch {}
}

function renderAll(d) {
  renderHeader(d);
  renderLeft(d);
  renderRight(d);
  initGallery(d);
}

!async function () {
  // Close button: back to where the user came from (homepage or library)
  $("closeBtn").addEventListener("click", () => {
    if (document.referrer && history.length > 1) history.back();
    else window.location.href = "homepage.html";
  });

  const params = new URLSearchParams(window.location.search);
  const idParam = (params.get("id") || "").trim();   
  const selected = readSelected();                   
  const basic = selected && (!idParam || String(selected.id) === idParam) ? basicToDetails(selected) : null;

  let shown = null;

  // Show what localStorage already knows straight away
  if (basic) { renderAll(basic); shown = basic; }

  // Fetch the full record (cast, crew, images, runtime...) and redraw with it
  const wantedId = idParam || (selected && selected.id) || "";
  const wantedTitle = (selected && selected.title) || (params.get("title") || "").trim();
  if (hasToken() && (wantedId || wantedTitle)) {
    try {
      let id = wantedId;
      if (!id) {
        const found = await tmdbGet("/search/movie", { query: wantedTitle, include_adult: "false" });
        id = found.results && found.results[0] && found.results[0].id;
      }
      if (id) {
        const full = await tmdbGet(`/movie/${encodeURIComponent(id)}`, {
          append_to_response: "credits,images",
          include_image_language: "en,null"
        });
        renderAll(full);
        shown = full;
      }
    } catch (err) {
      console.error("Could not load full movie details:", err);
    }
  }

  if (!shown) {
    $("mediaTitle").textContent = "Movie not found";
    $("mediaRight").innerHTML = `<p class="mediaError text-light">Pick a movie from the homepage or library to see its details.</p>`;
    return;
  }

  saveWatched(shown);
}();