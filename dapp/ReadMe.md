# Set up

## DIY

[Download](https://nodejs.org/en/download/), install nodejs, and in windows set PATH variable. Then
```
> mkdir dapp
> cd dapp

# instead of index.js --> app.js
> npm init 

> touch app.js

#  express@4.17.0
> npm install express --save 

# ejs@2.6.1
> npm install ejs --save 

# get the body from requests
> npm install body-parser --save

# automatic server restart for each change
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

## From Repository

Otherwise when cloning from github:

```
> clone https://github.com/basacul/Mana.git
> cd Mana/dapp
> npm install
> nodemon
```