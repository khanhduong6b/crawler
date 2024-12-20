require('dotenv').config({ path: __dirname + '/../../.env' });
const { Logger } = require('../util/logController')
const { Stock, StockTransaction } = require('../../models/stock')
const Crawler = require('../service/crawler')
const RedisService = require('../service/redisService')
const axios = require("axios");
const TimeUtil = require('../util/TimeUtil')
const mongoose = require('mongoose')
mongoose.pluralize(null);
const client = require('ssi-fcdata')

const rq = axios.create({
    baseURL: "https://fc-data.ssi.com.vn/",
    timeout: 5000
})

function StockController() {
    const SELF = {
        createModelStockTransactionBySymbol: (symbol) => {
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
        },
        getModelStockTransactionBySymbol: (symbol) => {
            const modelName = `stock_transaction_${symbol}`
            if (mongoose.models[modelName]) {
                return mongoose.models[modelName]; // Return the existing model
            } else {
                // If it doesn't exist, create and return the model
                return SELF.createModelStockTransactionBySymbol(symbol);
            }
        },
        storePopularStock: async (symbol) => {
            const data = await RedisService.receiveTokenInRedis('popular_stock')
            if (data && data?.includes(symbol)) return
            await RedisService.storeTokenInRedis('popular_stock', data + ',' + symbol)
            Logger.info('storePopularStock - success')
        },
        delay: (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
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
        getTransactionData: async (symbol, currentDate, tDate) => {
            const data = await Crawler.getIntradayData(symbol, fDate, tDate)
            return data
        },
        getAllData: async (req, res) => {
            try {
                const symbol = req.query.symbol;
                const page = req.query.page || 1;

                const StockTransaction = SELF.getModelStockTransactionBySymbol(symbol);
                const [data, totalDoc] = await Promise.all([
                    StockTransaction.find(
                        {},
                        { _id: 0, symbol: 1, tradingDate: 1, time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }
                    )
                        .sort({ tradingDate: 1, time: 1 })
                        .skip((page - 1) * 5000)
                        .limit(5000)
                        .lean(),
                    StockTransaction.countDocuments()
                ]);

                return res.status(200).json({ totalPage: Math.ceil(totalDoc / 5000), data });
            } catch (error) {
                Logger.error(JSON.stringify(error))
                return res.status(500).json({ error });
            }
        },
        getNewData: async (req, res) => {
            try {
                const symbol = req.query.symbol
                if (!symbol || symbol == null) return res.status(200).json({ data: [] })
                SELF.storePopularStock(symbol)
                const today = new Date();
                // Lấy chỉ số của ngày trong tuần (0 - Chủ Nhật, 1 - Thứ Hai, ..., 6 - Thứ Bảy)
                const dayIndex = today.getDay();

                const StockTransaction = SELF.getModelStockTransactionBySymbol(symbol)
                if (dayIndex == 1) {
                    const data = await StockTransaction.find(
                        { $or: [{ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date()) }, { tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date(new Date() - 60 * 60 * 24 * 1000 * 3)) }] },
                        { _id: 0, symbol: 1, tradingDate: 1, time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }
                    ).sort({ time: 1 }).lean();
                    return res.status(200).json({ data });
                }

                const data = await StockTransaction.find(
                    { $or: [{ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date()) }, { tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date(new Date() - 60 * 60 * 24 * 1000)) }] },
                    { _id: 0, symbol: 1, tradingDate: 1, time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }
                ).sort({ time: 1 }).lean();

                return res.status(200).json({ data });
            } catch (error) {
                console.log(error)
                return res.status(500).json({ error })
            }
        },
        getAccessToken: async (req, res) => {
            return RedisService.receiveTokenInRedis('access_token').then(data => {
                if (data) {
                    return res.status(200).json({ token: data })
                } else {
                    const options = {
                        consumerID: process.env.ConsumerID,
                        consumerSecret: process.env.ConsumerSecret,
                    }
                    return rq({ url: client.api.GET_ACCESS_TOKEN, method: 'post', data: options }).then(response => {
                        if (response.data.status === 200) {
                            RedisService.storeTokenInRedis('access_token', response.data.data.accessToken)
                            return res.status(200).json({ token: response.data.data.accessToken })
                        } else {
                            console.log(response.data.message)
                            return res.status(500).json({})
                        }
                    })
                }
            })
        },
        storeNewData: async (symbol) => {
            const currentDate = new Date();
            const StockTransaction = SELF.getModelStockTransactionBySymbol(symbol)
            try {
                const [dataNew, dataOld] = await Promise.all([
                    Crawler.getIntradayData(symbol, TimeUtil.getStrDate('DD/MM/YYYY', currentDate), TimeUtil.getStrDate('DD/MM/YYYY', currentDate)),
                    StockTransaction.find({ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', currentDate) }).lean()
                ])
                if (dataOld.length != dataNew.length) {
                    await StockTransaction.deleteMany({ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', currentDate) })
                    await StockTransaction.insertMany(dataNew)
                    //await RedisService.storeTokenInRedis(symbol, JSON.stringify(dataNew))
                    Logger.info('storeNewData ' + symbol + ' - success')
                }
            } catch (error) {
                Logger.error(error)
            }
        },
        jobSaveDailyData: async (currentDate) => {
            const listStock = await Stock.find().lean()
            for (let i = 0; i < listStock.length; i++) {
                const symbol = listStock[i].symbol
                if (symbol.length != 3) {
                    console.log(symbol)
                    continue
                }
                try {
                    const dataNew = await Crawler.getDailyData(symbol, currentDate, currentDate)
                    await StockTransaction.insertMany(dataNew)
                } catch (error) {
                    Logger.error(error)
                }
                await SELF.delay(1000)
            }
        },
        jobSaveIntradayData: async (fdate, tdate) => {
            const listStock = await Stock.find().lean()
            for (let i = 0; i < listStock.length; i++) {
                const symbol = listStock[i].symbol
                if (symbol.length != 3) {
                    console.log(symbol)
                    continue
                }
                try {
                    const data = await Crawler.getIntradayData(symbol, fdate, tdate)
                    Logger.info(fdate + ' -> ' + tdate + ' - symbol: ' + symbol + ' - totalRecord: ' + data.length)
                    if (data.length > 0) {
                        const StockTransaction = await SELF.getModelStockTransactionBySymbol(symbol)
                        await StockTransaction.deleteMany({ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date(fdate)) })
                        await StockTransaction.insertMany(data)
                    }
                } catch (error) {
                    Logger.error(JSON.stringify(error))
                }
                await delay(1000)
            }
            Logger.info('done crawl ' + fdate + ' -> ' + tdate)
        }
    }
}

module.exports = new StockController()