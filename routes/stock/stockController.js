require('dotenv').config({ path: __dirname + '/../../.env' });
const { Logger } = require('../util/logController')
const { Stock, StockTransaction } = require('../../models/stock')
const Crawler = require('../service/crawler')
const RedisService = require('../service/redisService')
const axios = require("axios");
const TimeUtil = require('../util/TimeUtil')

const client = require('ssi-fcdata')

const rq = axios.create({
    baseURL: "https://fc-data.ssi.com.vn/",
    timeout: 5000
})

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
        getAllData: async (req, res) => {
            try {
                const symbol = req.query.symbol
                if (!symbol) return res.status(200).json({ data: [] })
                const data = await StockTransaction.find({ symbol: symbol }, { _id: 0, symbol: 1, tradingDate: 1, time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }).lean()
                // sort by tradingDate and Time
                data.sort((a, b) => {
                    // First, sort by tradingDate
                    const dateA = new Date(a.tradingDate.split('/').reverse().join('-'));
                    const dateB = new Date(b.tradingDate.split('/').reverse().join('-'));

                    if (dateA < dateB) return -1;
                    if (dateA > dateB) return 1;

                    // If tradingDate is the same, sort by time
                    const timeA = a.time.split(':').join('');
                    const timeB = b.time.split(':').join('');

                    return timeA.localeCompare(timeB);
                });

                return res.status(200).json({ data })
            } catch (error) {
                return res.status(500).json({ error })
            }
        },
        getNewData: async (req, res) => {
            try {
                const symbol = req.query.symbol
                if (!symbol) return res.status(200).json({ data: [] })
                return RedisService.receiveTokenInRedis(symbol).then(async data => {
                    if (data) {
                        await RedisService.clearDataByKey(symbol);
                        const dataRes = JSON.parse(data)
                        return res.status(200).json({
                            data: dataRes.sort((a, b) => {
                                const dateA = new Date(a.tradingDate.split('/').reverse().join('-'));
                                const dateB = new Date(b.tradingDate.split('/').reverse().join('-'));

                                if (dateA < dateB) return -1;
                                if (dateA > dateB) return 1;

                                // If tradingDate is the same, sort by time
                                const timeA = a.time.split(':').join('');
                                const timeB = b.time.split(':').join('');

                                return timeA.localeCompare(timeB);
                            })
                        })
                    }
                    return res.status(200).json([])
                })
            } catch (error) {
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
            const [dataNew, dataOld] = await Promise.all([
                Crawler.getIntradayData(symbol, TimeUtil.getStrDate('DD/MM/YYYY', currentDate), TimeUtil.getStrDate('DD/MM/YYYY', currentDate)),
                StockTransaction.find({ symbol: symbol, tradingDate: TimeUtil.getStrDate('DD/MM/YYYY', currentDate) }).lean()
            ])
            if (dataOld.length != dataNew.length) {
                await StockTransaction.deleteMany({ symbol: symbol, tradingDate: TimeUtil.getStrDate('DD/MM/YYYY', currentDate) })
                await StockTransaction.insertMany(dataNew)
                await RedisService.storeTokenInRedis(symbol, JSON.stringify(dataNew))
            }
        }
    }
}

module.exports = new StockController()