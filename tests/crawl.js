const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Logger = require('./../routes/util/logController').Logger

const TimeUtil = require('../routes/util/TimeUtil')
const StockController = require('../routes/stock/stockController')
const Crawler = require('../routes/service/crawler')
const { Stock, StockTransaction } = require('../models/stock')
const RedisService = require('../routes/service/redisService');

dotenv.config();

function delay(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}

RedisService.initConnection()

mongoose.Promise = global.Promise
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGODB).then(async () => {
   // //await StockController.storeStock();
   console.log('done connect db')
   let fdate = '26/10/2024'
   //const data = await Crawler.getIntradayData('TCI', '01/02/2024', '29/02/2024')
   //{$in: ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']}
   const listStock = await Stock.find().lean()
   //const listStock = ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']
   //console.log(listStock)

   while (TimeUtil.compareDates(TimeUtil.getStrDate('DD/MM/YYYY', new Date()), fdate) == 1) {
      const tdate = '13/11/2024'
      for (let i = 0; i < listStock.length; i++) {
         const symbol = listStock[i].symbol
         if (symbol.length != 3) {
            console.log(symbol)
            continue
         }
         try {
            const data = await Crawler.getIntradayData(symbol, fdate, tdate)
            if (data.length > 0)
               await StockTransaction.insertMany(data)
         } catch (error) {
            Logger.error(error)
         }
         await delay(1000)
      }
      Logger.info('done crawl ' + fdate)
      fdate = TimeUtil.getNextMonth(fdate)
   }

   Logger.info('done crawl ' + fdate)

   //await StockController.storeNewData('TCI')
})
