// Core object class for the project
class Movie {
    constructor(_title, _rating, _image) {
        this.title = _title;
        this.rating = _rating;
        this.image = _image;
    }
}


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

let libraryDiv = document.getElementById('library');
let filterForm = document.getElementById('filter-form');


// Shows every movie as a simple line of text
function displayMovies(_movies){
    let lines = _movies.map(function(movie){
        return '<p>' + movie.title + ' - ' + movie.rating + '/10</p>';
    });

    libraryDiv.innerHTML = lines.join('');
}


// Loads movies from local storage, or gets them from the API first time the page is loaded, then displays them
!async function () {
    let savedMovies = JSON.parse(localStorage.getItem('movies'));

    if (!savedMovies) {
        const url = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc';

        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNjk4ZDZhODFjMTk1ZDkyZjc2ZjhhMWYyNGZmNjM1MCIsIm5iZiI6MTc4NjYyNDk1Mi42NzgwMDAyLCJzdWIiOiI2YTdkYmJiOGFhNWU4YzE5ZGE0NDM2NzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.UtbpK4tQlQzCExl3xr-6sDSZMO1gWcYxdm6qQSIYbG0'
            }
        };

        let data = await fetch(url, options)
            .then(res => res.json())
            .then(res => { return res })
            .catch(err => console.error(err));

        for (let i = 0; i < data.results.length; i++) {
            let title = data.results[i].title;
            let rating = data.results[i].vote_average;
            let imagePath = "https://image.tmdb.org/t/p/w500/" + data.results[i].poster_path;

            let myMovie = new Movie(title, rating, imagePath);
            myLibrary.addMovie(myMovie);
        }

        localStorage.setItem('movies', JSON.stringify(myLibrary.movies));
    } else {
        for (let i = 0; i < savedMovies.length; i++) {
            let myMovie = new Movie(savedMovies[i].title, savedMovies[i].rating, savedMovies[i].image);
            myLibrary.addMovie(myMovie);
        }
    }

    displayMovies(myLibrary.movies);
}();


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
