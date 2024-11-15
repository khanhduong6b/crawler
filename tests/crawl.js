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
function createModelStockTransactionMonthYear(month, year) {
    const schema = mongoose.Schema({
        symbol: { type: String, index: true },
        tradingDate: { type: String },
        time: { type: String },
        open: { type: Number },
        high: { type: Number },
        low: { type: Number },
        close: { type: Number },
        volume: { type: Number },
    }, { versionKey: false, timestamps: true, strict: false })
    return mongoose.model(`stock_transaction_${month}${year}`, schema)
}
function getModelStockTransactionByMonthYear(month, year) {
    const modelName = `stock_transaction_${month}${year}`
    if (mongoose.models[modelName]) {
        return mongoose.models[modelName]; // Return the existing model
    } else {
        // If it doesn't exist, create and return the model
        return createModelStockTransactionMonthYear(month, year);
    }
}
RedisService.initConnection()

mongoose.Promise = global.Promise
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGODB).then(async () => {
    // //await StockController.storeStock();
    console.log('done connect db')
    await RedisService.clearDataByKey('access_token')
    let fdate = '01/01/2020'
    //const data = await Crawler.getIntradayData('TCI', '01/02/2024', '29/02/2024')
    //{$in: ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']}
    const listStock = await Stock.find().lean()
    //const listStock = ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']
    //console.log(listStock)
    while (TimeUtil.compareDates(TimeUtil.getStrDate('DD/MM/YYYY', new Date()), fdate) == 1) {
        const tdate = TimeUtil.getLastDayOfMonth(fdate)
        console.log(fdate, tdate)
        for (let i = 0; i < listStock.length; i++) {
            const symbol = listStock[i].symbol
            if (symbol.length != 3) {
                console.log(symbol)
                continue
            }
            try {
                const data = await Crawler.getIntradayData(symbol, fdate, tdate)
                const dateInt = TimeUtil.getIntDateFromStrDate(fdate)
                const month = dateInt.toString().substring(4, 6)
                const year = dateInt.toString().substring(0, 4)
                const StockTransaction = getModelStockTransactionByMonthYear(month, year)
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

    //await removeDuplicate()

    //await StockController.storeNewData('TCI')
})

// async function removeDuplicate() {
//    const data = await StockTransaction.aggregate([
//       {
//           $group: {
//               _id: { date: "$date", stockSymbol: "$stockSymbol" },
//               ids: { $push: "$_id" }
//           }
//       },
//       {
//           $project: {
//               _id: 0,
//               ids: { $slice: ["$ids", 1, { $size: "$ids" }] }
//           }
//       }
//   ])
//   const idsToDelete = data.flatMap(doc => doc.ids.slice(1));
//   console.log(idsToDelete)
//     if (idsToDelete.length > 0) {
//       const result = await StockTransaction.deleteMany({ _id: { $in: idsToDelete } });
//       console.log(`Đã xóa ${result.deletedCount} bản ghi trùng lặp.`);
//   } else {
//       console.log("Không có bản ghi trùng lặp để xóa.");
//   }
// }