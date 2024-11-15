require('dotenv').config({ path: __dirname + '/../../.env' });
const { Logger } = require('../util/logController')
const { Stock, StockTransaction } = require('../../models/stock')
const Crawler = require('../service/crawler')
const RedisService = require('../service/redisService')
const axios = require("axios");
const TimeUtil = require('../util/TimeUtil')
const mongoose = require('mongoose')

const client = require('ssi-fcdata')

const rq = axios.create({
    baseURL: "https://fc-data.ssi.com.vn/",
    timeout: 5000
})

function StockController() {
    const SELF = {
        createModelStockTransactionMonthYear: (month, year) => {
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
        },
        getModelStockTransactionByMonthYear: (month, year) => {
            const modelName = `stock_transaction_${month}${year}`
            if (mongoose.models[modelName]) {
                return mongoose.models[modelName]; // Return the existing model
            } else {
                // If it doesn't exist, create and return the model
                return SELF.createModelStockTransactionMonthYear(month, year);
            }
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
                if (!symbol) return res.status(200).json({ data: [] });

                const totalDoc = await StockTransaction.countDocuments({ symbol: symbol });

                const data = await StockTransaction.find(
                    { symbol: symbol },
                    { _id: 0, symbol: 1, tradingDate: 1, time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }
                ).sort({ tradingDate: 1, time: 1 }).skip((page - 1) * 10000).limit(10000).lean();

                return res.status(200).json({ totalPage: Math.ceil(totalDoc / 10000), data });
            } catch (error) {
                return res.status(500).json({ error });
            }
        },
        getNewData: async (req, res) => {
            try {
                const symbol = req.query.symbol
                if (!symbol) return res.status(200).json({ data: [] })

                const today = new Date();
                // Lấy chỉ số của ngày trong tuần (0 - Chủ Nhật, 1 - Thứ Hai, ..., 6 - Thứ Bảy)
                const dayIndex = today.getDay();
                if (dayIndex == 1) {
                    const data = await StockTransaction.find(
                        { symbol: symbol, $or: [{ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date()) }, { tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date(new Date() - 60 * 60 * 24 * 1000 * 3)) }] },
                        { _id: 0, symbol: 1, tradingDate: 1, time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }
                    ).sort({ time: 1 }).lean();
                    return res.status(200).json({ data });
                }

                const data = await StockTransaction.find(
                    { symbol: symbol, $or: [{ tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date()) }, { tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', new Date(new Date() - 60 * 60 * 24 * 1000)) }] },
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
            const dateInt = TimeUtil.getIntDateFromStrDate(TimeUtil.getStrDate('DD/MM/YYYY', currentDate))
            const month = dateInt.toString().substring(4, 6)
            const year = dateInt.toString().substring(0, 4)
            const StockTransaction = SELF.getModelStockTransactionByMonthYear(month, year)
            try {
                const [dataNew, dataOld] = await Promise.all([
                    Crawler.getIntradayData(symbol, TimeUtil.getStrDate('DD/MM/YYYY', currentDate), TimeUtil.getStrDate('DD/MM/YYYY', currentDate)),
                    StockTransaction.find({ symbol: symbol, tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', currentDate) }).lean()
                ])
                if (dataOld.length != dataNew.length) {
                    await StockTransaction.deleteMany({ symbol: symbol, tradingDate: TimeUtil.getStrDate('YYYY-MM-DD', currentDate) })
                    await StockTransaction.insertMany(dataNew)
                    //await RedisService.storeTokenInRedis(symbol, JSON.stringify(dataNew))
                    Logger.info('storeNewData - success')
                }
            } catch (error) {
                Logger.error(error)
            }
        },
        jobSaveDailyData: async () => {
            const currentDate = TimeUtil.getStrDate('DD/MM/YYYY');
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
                    //await RedisService.storeTokenInRedis(symbol, JSON.stringify(dataNew))
                    Logger.info(currentDate + ' -> ' + currentDate + ' - symbol: ' + symbol + ' - totalRecord: ' + dataNew.length)
                } catch (error) {
                    Logger.error(error)
                }
                await SELF.delay(1000)
            }
        },
    }
}

module.exports = new StockController()