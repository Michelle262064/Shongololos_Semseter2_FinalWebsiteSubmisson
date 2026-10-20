// Movie class is already in script.js


// Container class that holds all the movies 
class Library {
    constructor(){
        this.movies = [];
    }

    addMovie(_movie){
        this.movies.push(_movie);
    }

    getMoviesAboveRating(_minRating){
        return this.movies.filter(function(movie){
            return movie.rating > _minRating;
        });
    }
}

let myLibrary = new Library();
let shownMovies = [];

let libraryDiv = document.getElementById('libraryGrid');
let filterForm = document.getElementById('filter-form');
let categoryPills = document.querySelectorAll('.category-pill');



// Shows every movie on the page as a card, with a "View movie" button added to each card
function displayMovies(_movies){
    shownMovies = _movies;
    renderGrid(libraryDiv, _movies, 'No movies found.');

    let cards = libraryDiv.querySelectorAll('.dashboard-movie-card');

    for (let i = 0; i < cards.length; i++) {
        cards[i].innerHTML = cards[i].innerHTML + '<button type="button" class="view-movie-btn">View movie</button>';
    }
}

// Loads movies from local storage, or gets them from the API first time the page is loaded, and then displays them on the page
!async function () {
    let savedMovies = JSON.parse(localStorage.getItem('movies'));

    if (!savedMovies || savedMovies.length < 25) {
        // The API gives 20 movies per page, so 2 pages are loaded to get more than 25 cards
        for (let page = 1; page <= 2; page++) {
            let data = await tmdbGet('/discover/movie', { sort_by: 'popularity.desc', page: page });

            console.log(data);

            for (let i = 0; i < data.results.length; i++) {
                myLibrary.addMovie(toMovie(data.results[i]));
            }
        }

        localStorage.setItem('movies', JSON.stringify(myLibrary.movies));
    } else {
        for (let i = 0; i < savedMovies.length; i++) {
            let myMovie = new Movie(savedMovies[i].title, savedMovies[i].rating, savedMovies[i].image, savedMovies[i].backdrop, savedMovies[i].overview, savedMovies[i].genres, savedMovies[i].id);
            myLibrary.addMovie(myMovie);
        }
    }

    displayMovies(myLibrary.movies);
}();


// Filter by category (All, Comedy, Drama, Action, Horror)
for (let i = 0; i < categoryPills.length; i++) {
    categoryPills[i].addEventListener('click', function(event){
        let genreName = event.target.textContent.trim().toLowerCase();
        displayMovies(filterLocal(myLibrary.movies, GENRE_IDS[genreName], ''));
    });
}


// Clicking a card, the "View movie" button or the bookmark
libraryDiv.addEventListener('click', function(event){
    handleCardClick(event, function(i){
        return shownMovies[i];
    });
});


// Filter by minimum rating
filterForm.addEventListener('submit', function(event){
    event.preventDefault();

    let minRating = parseFloat(document.getElementById('min-rating').value.trim());

    if (isNaN(minRating)) {
        alert('Please enter a valid rating');
        return;
    }

    displayMovies(myLibrary.getMoviesAboveRating(minRating));
});




// Reset the filter
document.getElementById('show-all').addEventListener('click', function(){
    displayMovies(myLibrary.movies);
});
