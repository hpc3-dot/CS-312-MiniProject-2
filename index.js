import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import axios from "axios";

const port = 3000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const blogPosts = [];
const apiKey = '2a061e0ba695c33d698a9ab739160622';
let weatherReport;
let geocodeData;

app.get('/', async (req, res) => {
  await getWeather('86004');
  console.log(weatherReport);
  res.render('index.ejs', { blogposts: blogPosts, weather: weatherReport, location: geocodeData });
});

app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/weather', async (req,res) =>{
  try {
    await getWeather(req.body.zipCode);
    res.render('index.ejs', { blogposts: blogPosts, weather: weatherReport, location: geocodeData });
  } 
  catch(error){
    console.log('weather not found')
    console.log(error.response?.data || error.message);
  }
});

app.post('/submit', (req, res) => {
  const newPost = {
  id: blogPosts.length + 1,
  postTitle: req.body.postTitle, 
  postContent: req.body.postContent,
  uName: req.body.uName,
  date: new Date().toLocaleString(),
  fishType: req.body.fishType,
  edit: false
}; 
  blogPosts.push(newPost);
  console.log('New blog post submitted:', blogPosts);
  res.redirect('/');
});

app.post('/edit', (req, res) => {
  const post = blogPosts.find(post => post.id == req.body.id);

  if (post) {
    post.edit = true;
  }
  res.redirect('/')
});

app.post('/update', (req, res) => {
  const post = blogPosts.find(post => post.id == req.body.id);

  if (post) {
    post.postTitle = req.body.postTitle;
    post.postContent = req.body.postContent;
    post.postName = req.body.postName;
    post.date = new Date().toLocaleString();
    post.fishType = req.body.fishType;
    post.edit = false;
  }
  res.redirect('/')
 
});

app.post('/delete', (req, res) =>{
  const index = blogPosts.findIndex(post => post.id == req.body.id);
  if (index !== -1) {
        blogPosts.splice(index, 1);
    }

    res.redirect("/");

});

app.post('/cancel', (req, res) => {
  const post = blogPosts.find(post => post.id == req.body.id);

  if (post) {
    post.edit = false;
  }
  res.redirect('/')
 
});

app.get('/filter', (req, res) => {
  const fishType = req.query.fishType;

  if (fishType === 'all') {
    res.redirect('/');
  } else {
    const filterFish = [];
    for (let i = 0; i < blogPosts.length; i++) {
      if (blogPosts[i].fishType === fishType) {
        filterFish.push(blogPosts[i]);
      }
    }
    res.render('index.ejs', {blogposts: filterFish, weather: weatherReport, location: geocodeData});
  }
});

async function getLongLat(zipCode){
  try {
    const countryCode = 'US';
    const geocodeUrl = `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},${countryCode}&appid=${apiKey}`
    const geocodeResponse = await axios.get(geocodeUrl);
    console.log(geocodeResponse);
    geocodeData = geocodeResponse.data;
    return geocodeResponse.data;
  }
    catch (error){
      console.error('Location not found');
      console.log(error.response?.data || error.message);
    }
  
}

async function getWeather(zipCode){
  try {
    const coords = await getLongLat(zipCode);
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&units=imperial&exclude=hourly,minutely&appid=${apiKey}`;
    const weatherResponse = await axios.get(weatherUrl);
    weatherReport = weatherResponse.data;
  }
  catch(error){
    console.log('weather not found')
    console.log(error.response?.data || error.message);
  }
}