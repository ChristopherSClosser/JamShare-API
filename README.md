[![Build Status](https://travis-ci.org/ChristopherSClosser/JamShare-API.svg?branch=master)](https://travis-ci.org/ChristopherSClosser/JamShare-API)
[![Coverage Status](https://coveralls.io/repos/github/ChristopherSClosser/JamShare-API/badge.svg?branch=master)](https://coveralls.io/github/ChristopherSClosser/JamShare-API?branch=master)

# JamShare

### Who Are We?
JamShare is an open-source, music-sharing platform designed to allow musicians to share individual components of their music, (like a guitar riff or a drum solo), and connect with other artists who are looking for a similar piece to add to their own jam.

### Specs

- Full-stack JavaScript application with its own RESTful API.
- Utilizes MongoDB and Mongoose.js to store Artist information.
- Utilizes Mocha and Chai for back-end testing.

### Contributing to JamShare
If you're a developer and wish to contribute to JamShare, follow the usage instructions below and feel free to hack away. Once you're done making JamShare even better than it already is, submit a pull request to the "dev" branch. We'll review it and let you know if we decide to merge your changes to production.

### Usage

- Fork and clone our front-end repository into a local directory. Navigate to the directory in  your terminal, and run ```npm install``` to install all required project dependencies.
- Create a file called '.env' at the root level of the directory. Copy and paste the following into it:
   ```
   API_URL='https://jamshare-api.heroku.com
   ```
- In your terminal, run ```npm run build-watch```. Our live back-end will be served up on PORT 8080.

### Making API Calls
Below is a comprehensive list of valid endpoints in our API, the HTTP methods they are compatible with, as well as what a successful request should produce. We recommend using Postman to make requests.

#### Artist Routes

- POST request to ```/api/signup```
  - Should create a new Artist object and add it to the database.

- GET request to ```/api/login```
  - Should retrieve an existing Artist object from the database and log them in.

#### Profile Routes

- GET request to ```/api/profile```
  - Should retrieve the Profile page of the Artist who is logged in.

#### Song Routes

- POST request to ```/api/song```
  - Should create a new Song object and add it to the database.

- GET request to ```/api/song```
  - Should retrieve all Song objects from the database that were created by the Artist who is logged in.

- GET request to ```/api/song/:id```
  - Should retrieve a specific Song object from the database.

- GET request to ```/api/public/song```
  - Should retrieve all Song objects, created by all Artists, from the database.

- PUT request to ```/api/song/:id```
  - Should update the properties of a specific Song object (changes should be reflected in the database, too).

- DELETE request to ```/api/song/:id```
  - Should delete a specific Song object from the database.

#### Element Routes

- POST request to ```/api/song/:songID/element```
  - Should create a new Element object for a specific Song object, and add it to the database.

- GET request to ```/api/element```
  - Should retrieve all Element objects from the database that were created by the Artist who is logged in.

- GET request to ```/api/public/element```
  - Should retrieve all Element objects, for all Song objects, from the database.

- DELETE request to ```/api/song/:songID/element/:elementID```
  - Should delete a specific Element object of a specific Song object from the database.

Developed by Code Fellows JavaScript students: Chris Closser, Isak Swearingen, Kayla Asay, and Kaylee Alvarado

Project adapted from Code Fellows assignment, "SlugGram".

Documentation written by: Kaylee Alvarado
