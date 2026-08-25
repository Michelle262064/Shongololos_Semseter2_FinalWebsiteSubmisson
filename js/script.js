// Core object class for the project
class Movie {
    constructor(_title, _rating, _image) {
        this.title = _title;
        this.rating = _rating;
        this.image = _image;
    }
}

// Async function to handle API connection and data retrieval
!async function () {
    const url = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc';
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNjk4ZDZhODFjMTk1ZDkyZjc2ZjhhMWYyNGZmNjM1MCIsIm5iZiI6MTc4NjYyNDk1Mi42NzgwMDAyLCJzdWIiOiI2YTdkYmJiOGFhNWU4YzE5ZGE0NDM2NzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.UtbpK4tQlQzCExl3xr-6sDSZMO1gWcYxdm6qQSIYbG0'
        }
    };

    // Fetching data from The Movie Database (TMDB)
    let data = await fetch(url, options)
        .then(res => res.json())
        .then(res => { return res })
        .catch(err => console.error(err));

    // Console log to verify API data structure
    console.log(data);

    // Extracting API data into local variables
    let title = data.results[0].title;
    let rating = data.results[0].vote_average;
    let imagePath = "https://image.tmdb.org/t/p/w500/" + data.results[0].poster_path;

    // Creating an instance of the Movie object
    let myMovie = new Movie(title, rating, imagePath);

    // Injecting data into Ari's HTML containers
    document.getElementById('title').innerHTML = myMovie.title;
    
    document.getElementById('content').innerHTML = 
        "User Rating: " + myMovie.rating + "/10 <br><br>" +
        "<img src='" + myMovie.image + "' style='width:250px; border-radius:10px;'>";

}();