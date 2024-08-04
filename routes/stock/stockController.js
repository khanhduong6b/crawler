const { Logger } = require('../util/logController')
const { Stock, StockTransaction } = require('../../models/stock')
const Crawler = require('../service/crawler')
const RedisService = require('../service/redisService')

function StockController() {
    return {
        storeStock: async () => {
            const data = await Crawler.crawlStock()
            const list = data.map(item => {
                return {
                    market: item.Market,
                    symbol: item.Symbol,
                    name: item.StockName,
                    enName: item.StockEnName
                }
            })
            await Stock.deleteMany({})
            await Stock.insertMany(list)
            Logger.info('storeStock - success')
        },
        getTransactionData: async (symbol, fDate, tDate) => {
            const data = await Crawler.getIntradayData(symbol, fDate, tDate)
            return data
        },
        getAllData: async (req,res) => {
            const symbol = req.query.symbol
            const data = await StockTransaction.find({symbol: symbol}).lean()
            return res.status(200).json(data)
        },
        getNewData: async (req,res) => {
            const symbol = req.query.symbol
            return RedisService.receiveTokenInRedis(symbol).then(data => {
                if (data) {
                    return res.status(200).json(data)
                }
                return res.status(200).json([])
            })
        }
    }
}

module.exports = new StockController()