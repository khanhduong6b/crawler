require('dotenv').config({ path: __dirname + '/../../.env' });
const { Logger } = require('../util/logController')
const RedisService = require('./redisService')
const client = require('ssi-fcdata')
const axios = require("axios");
const TimeUtil = require('../util/TimeUtil')

const rq = axios.create({
    baseURL: "https://fc-data.ssi.com.vn/",
    timeout: 5000
})

function Crawler() {
    const SELF = {
        delay: function (ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
          },
        setAccessToken: async () => {
            const options = {
                consumerID: process.env.ConsumerID,
                consumerSecret: process.env.ConsumerSecret,
            }
            return rq({ url: client.api.GET_ACCESS_TOKEN, method: 'post', data: options }).then(async response => {
                if (response.data.status === 200) {
                    await RedisService.storeTokenInRedis('access_token', response.data.data.accessToken)
                    return response.data.data.accessToken;
                } else {
                    console.log(response.data.message)
                    return false
                }
            })
        },
        getAccessToken: async () => {
            return RedisService.receiveTokenInRedis('access_token').then(data => {
                if (data) {
                    return Promise.resolve(data)
                } else {
                    const options = {
                        consumerID: process.env.ConsumerID,
                        consumerSecret: process.env.ConsumerSecret,
                    }
                    return rq({ url: client.api.GET_ACCESS_TOKEN, method: 'post', data: options }).then(async response => {
                        if (response.data.status === 200) {
                            RedisService.storeTokenInRedis('access_token', response.data.data.accessToken)
                            await SELF.delay(1000)
                            return response.data.data.accessToken;
                        } else {
                            console.log(response.data.message)
                        }
                    })
                }
            })
        }
    }
    return {
        /**@description: Crawl data from SSI */
        crawlStock: async () => {
            var request = {
                market: 'HNX',
                pageIndex: 1,
                pageSize: 1000
            }
            const accessToken = await SELF.getAccessToken()
            return rq({ url: client.api.GET_SECURITIES_LIST, method: 'get', headers: { [client.constants.AUTHORIZATION_HEADER]: client.constants.AUTHORIZATION_SCHEME + " " + accessToken }, params: request }).then(response => {
                console.log('crawlStock - totalRecord: ' + response.data.totalRecord)
                return response.data.data
            })
        },
        getIntradayData: async (symbol,fDate, tDate) => {
            var request = {
                Symbol: symbol,
                FromDate: fDate, // dd/mm/yyyy
                ToDate: tDate, // dd/mm/yyyy
                PageIndex: 1,
                PageSize: 5000,
                Asscending: true
            }
            const accessToken = await SELF.getAccessToken()
            return rq({ url: client.api.GET_INTRADAY_OHLC, method: 'get', headers: { [client.constants.AUTHORIZATION_HEADER]: client.constants.AUTHORIZATION_SCHEME + " " + accessToken }, params: request }).then(response => {
                if (response.data.totalRecord > 0) {
                return response.data.data.map(item => {
                    return {
                        symbol: item.Symbol,
                        value: item.Value,
                        tradingDate: `${item.TradingDate.slice(6, 10)}-${item.TradingDate.slice(3, 5)}-${item.TradingDate.slice(0, 2)}`,
                        time: item.Time,
                        open: item.Open,
                        high: item.High,
                        low: item.Low,
                        close: item.Close,
                        volume: item.Volume
                    }
                })
                } else {
                    console.log(response.data)
                    return []
                }
            }).catch(async error => {
                await RedisService.clearDataByKey('access_token')
                Logger.error(error)
                return []
            })
        },
        getDailyData: async (symbol, fDate, tDate) => {
            var request = {
                Symbol: symbol,
                FromDate: fDate, // dd/mm/yyyy
                ToDate: tDate, // dd/mm/yyyy
                PageIndex: 1,
                PageSize: 5000,
                Asscending: true
            }
            const accessToken = await SELF.getAccessToken()
            return rq({ url: client.api.GET_DAILY_OHLC, method: 'get', headers: { [client.constants.AUTHORIZATION_HEADER]: client.constants.AUTHORIZATION_SCHEME + " " + accessToken }, params: request }).then(response => {
                Logger.info(fDate + ' -> ' + tDate + ' - symbol: ' + symbol + ' - totalRecord: ' + response.data.totalRecord)
                if (response.data.totalRecord > 0) {
                return response.data.data.map(item => {
                    return {
                        symbol: item.Symbol,
                        value: item.Value,
                        tradingDate: `${item.TradingDate.slice(6, 10)}-${item.TradingDate.slice(3, 5)}-${item.TradingDate.slice(0, 2)}`,
                        time: item.Time,
                        open: item.Open,
                        high: item.High,
                        low: item.Low,
                        close: item.Close,
                        volume: item.Volume
                    }
                })
                } else {
                    console.log(response.data)
                    return []
                }
            }).catch(async error => {
                await RedisService.clearDataByKey('access_token')
                Logger.error(error)
                return []
            })
        }
    }
}

module.exports = new Crawler()