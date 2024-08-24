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

   let fdate = '20/06/2022'
   //const data = await Crawler.getIntradayData('TCI', '01/02/2024', '29/02/2024')
	//{$in: ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']}
   //const listStock = await Stock.find({ symbol: 'PPT'}).lean()

   // //console.log(listStock)

   // while (TimeUtil.compareDates(TimeUtil.getStrDate('DD/MM/YYYY', new Date()), fdate) == 1) {
   //    if (TimeUtil.getDayOfWeek(fdate) != 'CHU NHAT' && TimeUtil.getDayOfWeek(fdate) != 'THU BAY')
   //       {
   //          const symbol = "PPT"
   //          const data = await Crawler.getIntradayData(symbol, fdate, fdate)
   //          try {
   //             if (data.length > 0)
   //                await StockTransaction.insertMany(data)
   //          } catch (error) {
   //             Logger.error(error)
   //          }
   //          await delay(1000)
   //       }
   //    Logger.info('done crawl ' + fdate)
   //    fdate = TimeUtil.getNextDate(fdate)
   // }

   // Logger.info('done crawl ' + fdate)

   //await StockController.storeNewData('TCI')
   console.log(new Date(new Date() - 60 * 60 * 24 * 1000))
})
