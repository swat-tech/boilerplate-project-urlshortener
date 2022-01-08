require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const router = express.Router();

const TIMEOUT = 10000;

//Include the body-parser module
var bodyParser = require('body-parser');
//When extended=false it uses the classic encoding querystring library
app.use(bodyParser.urlencoded({ extended: false }));
//Mount the middleware
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

var mongoose = require('mongoose');
mongoose.connect(process.env['MONGO_URI']);

const { Schema } = mongoose;

const urlSchema = new Schema({
  url: {type: String, required: true},
  shortUrl: Number
});

const URLModel = mongoose.model('Url', urlSchema);

//Get the url from the POST request
let response = {};
app.post('/api/shorturl', (req,res)=>{

  //Get the max value of the shortUrl in MongoDb
  console.log(req.body.url);
  let inputUrl = req.body.url;
  let UrlRegex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);

  if(!inputUrl.match(UrlRegex)){
    res.json({"error":"Invalid URL"});
    return;
  }

  response['original_url'] = inputUrl;
  let newShortUrl = 1;
  
  URLModel.findOne({})
  .sort({shortUrl:'desc'})
  .exec((err,result)=>{
    if(!err && result != undefined){
      newShortUrl = result.shortUrl+1;
    }
    if(!err){
       //If exists then return the value in DB
      URLModel.findOne({url:inputUrl})
        .exec((err,savedUrl)=>{
          if(err){
            //Not found in DB
            var newUrl = new URLModel({"url":inputUrl,"shortUrl":newShortUrl});
            newUrl.save((err,newSavedUrl)=>{
              if(err) return console.error(err);
              response['short_url']=savedUrl.newSavedUrl;
              res.json(response);
            })
          }else {
            response['short_url']=savedUrl.shortUrl;
            res.json(response);
          }         
        }
      )
    }
  })
});

app.get('/api/shorturl/:shortUrl', (req,res)=>{
  let input = req.params.shortUrl;
  URLModel.findOne({shortUrl:input})
  .exec((err,result)=>{
    if(!err && result != undefined){
      let originalUrl = result.url;
      res.redirect(originalUrl);
    }

});
});

