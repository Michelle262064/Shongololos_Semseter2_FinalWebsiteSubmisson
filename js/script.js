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

function toggleWatchlist(movieData) {
    let watchlist = JSON.parse(localStorage.getItem('streamlineWatchlist')) || [];
    const existingIndex = watchlist.findIndex(movie => movie.id === movieData.id);

    if (existingIndex > -1) {
        watchlist.splice(existingIndex, 1);
        alert('Removed from your Watchlist');
    } else {
        watchlist.push(movieData);
        alert('Added to your Watchlist!');
    }

    localStorage.setItem('streamlineWatchlist', JSON.stringify(watchlist));
}

function removeFromWatchlist(movieId) {
    let savedWatchlist = JSON.parse(localStorage.getItem('streamlineWatchlist')) || [];
    savedWatchlist = savedWatchlist.filter(movie => movie.id !== movieId);
    localStorage.setItem('streamlineWatchlist', JSON.stringify(savedWatchlist));
    location.reload();
}