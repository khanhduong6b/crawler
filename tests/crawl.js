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
function createModelStockTransactionBySymbol(symbol) {
    mongoose.pluralize(null);
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
    return mongoose.model(`stock_transaction_${symbol}`, schema)
}
function getModelStockTransactionBySymbol(symbol) {
    const modelName = `stock_transaction_${symbol}`
    if (mongoose.models[modelName]) {
        return mongoose.models[modelName]; // Return the existing model
    } else {
        // If it doesn't exist, create and return the model
        return createModelStockTransactionBySymbol(symbol);
    }
}

RedisService.initConnection()

mongoose.Promise = global.Promise
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGODB).then(async () => {
    // //await StockController.storeStock();
    console.log('done connect db')
    await RedisService.clearDataByKey('access_token')
    let fdate = '25/11/2024'
    //const data = await Crawler.getIntradayData('TCI', '01/02/2024', '29/02/2024')
    //{$in: ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']}
    const listStock = await Stock.find().lean()
    //const listStock = ['VPG', 'HPG', 'AGG', 'VIB', 'PNJ', 'FPT']
    //console.log(listStock)
    // while (TimeUtil.compareDates(TimeUtil.getStrDate('DD/MM/YYYY', new Date()), fdate) == 0) {
    //     const tdate = '22/11/2024'
    //     for (let i = 0; i < listStock.length; i++) {
    //         const symbol = listStock[i].symbol
    //         if (symbol.length != 3) {
    //             console.log(symbol)
    //             continue
    //         }
    //         try {
    //             const data = await Crawler.getIntradayData(symbol, fdate, tdate)
    //             Logger.info(fdate + ' -> ' + tdate + ' - symbol: ' + symbol + ' - totalRecord: ' + data.length)
    //             if (data.length > 0)
    //             {
    //                 const StockTransaction = await getModelStockTransactionBySymbol(symbol)
    //                 await StockTransaction.insertMany(data)
    //             }
    //         } catch (error) {
    //             Logger.error(JSON.stringify(error))
    //         }
    //         await delay(1000)
    //     }
    //     Logger.info('done crawl ' + fdate)
    //     fdate = TimeUtil.getNextMonth(fdate)
    // }

    // Logger.info('done crawl ' + fdate)
    //await removeDuplicate()
    while (TimeUtil.compareDates(TimeUtil.getStrDate('DD/MM/YYYY', new Date()), fdate) != 0) {
        const tdate = TimeUtil.getLastDayOfMonth(fdate)
        for (let i = 0; i < listStock.length; i++) {
            const symbol = listStock[i].symbol
            if (symbol.length != 3) {
                console.log(symbol)
                continue
            }
            try {
                const dataNew = await Crawler.getDailyData(symbol, fdate, tdate)
                await StockTransaction.insertMany(dataNew)
                await delay(1000)
            } catch (error) {
                Logger.error(error)
            }
        }
        Logger.info('done crawl ' + fdate)
        fdate = TimeUtil.getNextMonth(tdate)
    }
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