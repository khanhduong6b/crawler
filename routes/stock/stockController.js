require('dotenv').config({ path: __dirname + '/../../.env' });
const { Logger } = require('../util/logController')
const { Stock, StockTransaction } = require('../../models/stock')
const Crawler = require('../service/crawler')
const RedisService = require('../service/redisService')
const axios = require("axios");

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
        },
        getAccessToken: async (req, res) => {
            return RedisService.receiveTokenInRedis('access_token').then(data => {
                if (data) {
                    return res.status(200).json(data)
                } else {
                    const options = {
                        consumerID: process.env.ConsumerID,
                        consumerSecret: process.env.ConsumerSecret,
                    }
                    return rq({ url: client.api.GET_ACCESS_TOKEN, method: 'post', data: options }).then(response => {
                        if (response.data.status === 200) {
                            RedisService.storeTokenInRedis('access_token', response.data.data.accessToken)
                            return  res.status(200).json(response.data.data.accessToken)
                        } else {
                            console.log(response.data.message)
                            return res.status(500).json({})
                        }
                    })
                }
            })
        }
    }
}

module.exports = new StockController()