const CronJob = require('cron').CronJob
const { Scheduler } = require('./logController')
const RedisService = require('../service/redisService')
const StockController = require('../stock/stockController')
const { Stock } = require('../../models/stock')
/**@class SchedulerTask*/
function SchedulerTask() {
  const SELF = {
    delay: function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  return {
    allTask: () => {
      // every 5 minute in week from monday to friday
      new CronJob('*/5 * * * 1-5', async function () {
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      // every 30 minute in week from monday to friday
      new CronJob('*/5 * * * *', async function () {
        await RedisService.clearDataByKey('access_token')
        Scheduler.info('access_token - success')
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('0 45 15 * * 1-5', function () {
        // every friday at 15:45 to do MOD
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('00 00 23 * * 1-5', async function () {
        await RedisService.clearDataByKey('access_token')
        const listStock = await Stock.find({}).lean()
        for (let i = 0; i < listStock.length; i++) {
          const symbol = listStock[i]
          await StockController.storeNewData(symbol)
          Scheduler.info(symbol + ' - success')
          await SELF.delay(1000)
        }
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('0 8 1 * *', function () { //Run 8:00 am first day of month
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('30 8 7,14,21,28 * *', async function () {
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('30 8 28-31 * *', async function () { //Job chạy vào cuối tháng
      }, null, true, 'Asia/Ho_Chi_Minh').start()
    }
  }
}

module.exports = new SchedulerTask()
