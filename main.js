// libraries
require('dotenv').config({path: '.env'})
var request = require('request');
var sleep = require('sleep');
var fs = require('fs');
var rp = require('request-promise');
var http = require('http'), url = require('url'), qs = require('querystring');

//REST call
http.createServer(async function (req, res) {
    var urlParts = url.parse(req.url, true),
        urlParams = urlParts.query;
    var keyword = urlParams.keyword;
    // Get items Ids from the CSV file
    var text_items = fs.readFileSync('items.csv', 'utf8').replace( /\n/g, " " ).split(" ");
    text_items.pop();
    // var text_items= ['14225185','14225186','14225188','14225187','39082884', '30146244', '12662817', '34890820','19716431', '42391766','35813552','40611708','40611825','36248492','44109840','23117408','35613901','42248076'];
    var matchingItems = new Array();
    for (i = 0; i < text_items.length  ; i++){
      sleep.msleep(100);
      matchingItems.push(await getMatchingItem(keyword, text_items[i]));
    }
    var result_array = matchingItems.filter(function(x){
        return (x !== (undefined));
        });
    req.on('data', function (data) {
    });
    req.on('end', function () {
        res.writeHead(200, {'Content-type':'application/json'});
        res.end(JSON.stringify(result_array));
    });
}).listen(5000);


// Iterate the items, creates urls array and return matching items in an array
async function getMatchingItem(keyword,item){
  var url = "http://api.walmartlabs.com/v1/items/"+ item;
  return await searchMatchingItem(keyword, url);
}

// Request promise is used to pipe the requests
function getResponse(keyword, url) {
  var options = {
    uri: url,
    qs:{
        apiKey: process.env.WALMART_PRODUCT_API
    },
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };
  return rp(options)
  .then(function(res){
     if(isMatching(keyword, res)){
        console.log("API call passed..." + res.itemId);
        return res.itemId;
      }
      return -1;
  });
}

// method to make serial api requests
async function searchMatchingItem(keyword, url){
  var  matchingItem;
  var data = await getResponse(keyword, url);
  if (data != -1) {
    matchingItem = data;
  }
  return matchingItem;
}

//Search for the keyword in the item's description
//includes() works well with undefined and NaN. Similar complexity and semantics as of indexOf()
// Can use search() and match() if we use Reg-ex
function isMatching(keyword, metadata){
  if(metadata.shortDescription || metadata.longDescription){
    if (metadata.shortDescription.toLowerCase().includes(keyword)){
        return true;
    }else if(metadata.longDescription.toLowerCase().includes(keyword)){
        return true;
    }
  }
  return false;
}


