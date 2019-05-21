# Set up
[Download](https://nodejs.org/en/download/), install nodejs, and in windows set PATH variable. Then
```python
> mkdir dapp
> cd dapp
> npm init # instead of index.js --> app.js
> touch app.js
> npm install express --save #  express@4.17.0
> npm install ejs --save # ejs@2.6.1
# get the body from requests
> npm install body-parser --save
# restarts server after each saved change and does not install in project but globally
> npm i -g nodemon 
> mkdir views
> mkdir views/partials
> mkdir public
> mkdir public/css
> mkdir public/js
> mkdir public/img
```
Include logic and html files.

Run nodemon app.js