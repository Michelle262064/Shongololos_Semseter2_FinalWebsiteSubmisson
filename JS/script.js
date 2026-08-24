class Movie {
    constructor(_title, _rating, _link, _image){
        this.title = _title;
        this.rating = _rating;
        this.link = _link;
        this.image = _image;
    }
}

//let movieArray = [];
!async function(){
  const url = 'https://imdb-top-100-movies.p.rapidapi.com/';
  const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNjk4ZDZhODFjMTk1ZDkyZjc2ZjhhMWYyNGZmNjM1MCIsIm5iZiI6MTc4NjYyNDk1Mi42NzgwMDAyLCJzdWIiOiI2YTdkYmJiOGFhNWU4YzE5ZGE0NDM2NzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.UtbpK4tQlQzCExl3xr-6sDSZMO1gWcYxdm6qQSIYbG0'
  }
 };

  fetch('https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc', options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err));
  console.log(data);

 //for (let i = 0; i < movieArray.length; i++){. //[0] ~ [i]
      let title = data[0].title;
      let rating = data[0].rating;
      let link = data[0].imdb_link;
      let image = data[0].image;

      let newMovie = new Movie(title, rating, link, image);
     // movieArray.push(newMovie);
   // }

 
 document.getElementById('title').innerHTML = newMovie.title;
 document.getElementById('content').innerHTML = newMovie.rating + "<br>" + newMovie.link + "<br>" + "<img src ='" + newMovie.image + "'>";

 console.log(newMovie);

}();