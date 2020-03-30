/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

// Not best practice but needed to allow FCC automated testing to succeed
process.env.DB='mongodb+srv://new-user_1:H9JNkTUxK0hu9CbB@cluster0-tccbk.mongodb.net/test?retryWrites=true&w=majority'

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const request = require('request');
const fetch = require('node-fetch');
const querystring = require('querystring');

const stockSchema =  new Schema({
  stock: {type: String, unique: true, required: true, dropDups: true},
  likes: {type: Number},
  likesIpAddresses: {type: [String]}
});

const StockCollection = mongoose.model('StockCollection', stockSchema);

// Mongoose setup and connection
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.DB)
  .then( () => console.log('Connection made') )
  .catch( err => console.error(err) );


module.exports = function (app) {


  app.route('/api/stock-prices')
    .get(function (req, res){
      const ipAddress = req.ip.slice(7);

      const queryLikes = req.query.like;

      let queryStockOne;
      let queryStockTwo;
      
      if (Array.isArray(req.query.stock)) {
        queryStockOne = req.query.stock[0];
        queryStockTwo = req.query.stock[1];
      } else {
        queryStockOne = req.query.stock;
      }

      // Fetch stock information from fake stock API
      async function fetchAsync(url) {
        let response = await fetch(url);
        let data = await response.json();
        return data;
      }

      // Query database for stock information
      // If stock does not exist, add
      // Return database record
      async function asyncDatabaseHandler(stockName, isLiked, ip) {
        let result = await StockCollection.findOne({stock: stockName});
        let finalResult;

        if (result) {
          if (isLiked && !result.likesIpAddresses.includes(ip)) {
            result.likes += 1;
            result.likesIpAddresses.push(ip);
            finalResult = await result.save()
          }
        } else {
          let numLikes = 0;
          let newIp = [];
          if (isLiked) {
            numLikes = 1;
            newIp.push(ip);
          } 
          const newStock = new StockCollection({stock: stockName, likes: numLikes, likesIpAddresses: []});
          finalResult = await newStock.save();
        }

        if (finalResult) return finalResult;   
        return result;
      }


      let promise1 = fetchAsync(`https://repeated-alpaca.glitch.me/v1/stock/${queryStockOne}/quote`);
      let promise2 = asyncDatabaseHandler(queryStockOne, queryLikes, ipAddress);
      let promise3;
      let promise4;

      if (queryStockTwo) {
        promise3 = fetchAsync(`https://repeated-alpaca.glitch.me/v1/stock/${queryStockTwo}/quote`);
        promise4 = asyncDatabaseHandler(queryStockTwo, queryLikes, ipAddress);
      }

      Promise.all([promise1, promise2, promise3, promise4])
        .then( data => {
          if (!data[2] && !data[3]) {
            return res.json({stockData: {stock: data[0].symbol, price: data[0].latestPrice, likes: data[1].likes}});
          }
          const relativeLikes = data[1].likes - data[3].likes;
          return res.json({stockData: [
            {stock: data[0].symbol, price: data[0].latestPrice, rel_likes: relativeLikes}, 
            {stock: data[2].symbol, price: data[2].latestPrice, rel_likes: relativeLikes} 
          ] 
          });
        })
        .catch(err => console.error(err));

    });    
};
