const CronJob = require('cron').CronJob
const { Scheduler, Logger } = require('./logController')
const RedisService = require('../service/redisService')
const StockController = require('../stock/stockController')
const { Stock } = require('../../models/stock')
/**@class SchedulerTask*/
function SchedulerTask() {
  const SELF = {
    delay: async function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  return {
    allTask: () => {
      // every 1 minute from 8 am to 5 pm in week
      new CronJob('*/1 * 8-17 * 1-5', async function () {
        const data = await RedisService.receiveTokenInRedis('popular_stock')
        if (data == null) return
        const listStock = data.split(',')
        for (let i = 0; i < listStock.length; i++) {
          const symbol = listStock[i]
          if (symbol.length != 3) {
            continue
          }
          try {
            await StockController.storeNewData(symbol)
            await SELF.delay(1000);
            Scheduler.info(symbol + ' - success')
          } catch (error) {
            Logger.error(error)
          }
        }
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      // every 30 minute in week from monday to friday
      new CronJob('*/3 * * * *', async function () {
        await RedisService.clearDataByKey('access_token')
        Scheduler.info('access_token - success')
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('0 45 15 * * 1-5', function () {
        // every friday at 15:45 to do MOD
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('0 0 23 * * 1-5', async function () {
        await RedisService.clearDataByKey('access_token')
        const currentDate = TimeUtil.getStrDate('DD/MM/YYYY')
        await StockController.jobSaveDailyData(currentDate)
        setTimeout(async () => {
          await StockController.jobSaveIntradayData(currentDate, currentDate)
        }, 1000)
        Logger.info('jobSaveDailyData - success')
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
