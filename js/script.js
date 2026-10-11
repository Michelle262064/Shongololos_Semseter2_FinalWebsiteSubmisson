document.addEventListener('DOMContentLoaded', () => {
  const signinSection = document.getElementById('signinSection');
  const signupSection = document.getElementById('signupSection');
  const showSignupBtn = document.getElementById('showSignup');
  const showSigninBtn = document.getElementById('showSignin');

  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', e => {
      e.preventDefault();
      signinSection.classList.add('hidden');
      signupSection.classList.remove('hidden');
    });
  }
  if (showSigninBtn) {
    showSigninBtn.addEventListener('click', e => {
      e.preventDefault();
      signupSection.classList.add('hidden');
      signinSection.classList.remove('hidden');
    });
  }

  const signinForm = document.getElementById('signinForm');
  if (signinForm) signinForm.addEventListener('submit', e => {
    e.preventDefault();
    console.log('Sign In form submitted');
  });

  const signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', e => {
    e.preventDefault();
    console.log('Sign Up form submitted');
  });

  const watchlistGrid = document.getElementById('watchlistGrid');
  if (!watchlistGrid) return;

  function renderWatchlist() {
    const list = getWatchlist();
    if (!list.length) {
      watchlistGrid.innerHTML = `<p class="empty-msg">Your watchlist is empty. Go explore some movies!</p>`;
      return;
    }
    watchlistGrid.innerHTML = list.map(movie => `
      <div class="movie-card">
        ${movie.image
          ? `<img src="${escapeHTML(movie.image)}" alt="${escapeHTML(movie.title)}">`
          : `<div class="poster-fallback">${escapeHTML(movie.title)}</div>`}
        <div class="card-info">
          <h3>${escapeHTML(movie.title)}</h3>
          <p><i class="fa-solid fa-star"></i> ${Number(movie.rating).toFixed(1)}</p>
          <button class="remove-btn" data-key="${escapeHTML(movieKey(movie))}">Remove</button>
        </div>
      </div>`).join('');
  }

  watchlistGrid.addEventListener('click', e => {
    const btn = e.target.closest('.remove-btn');
    if (!btn) return;
    const movie = getWatchlist().find(m => movieKey(m) === btn.dataset.key);
    if (movie) toggleWatchlist(movie);
    renderWatchlist();
  });

  renderWatchlist();
});