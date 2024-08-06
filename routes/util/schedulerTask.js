const CronJob = require('cron').CronJob
const RedisService = require('../service/redisService')
/**@class SchedulerTask*/
function SchedulerTask() {
  const SELF = {}
  return {
    allTask: () => {
      new CronJob('15 8 * * *', async function () {
        // every day at 8:15
        await RedisService.clearDataByKey('access_token')
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('0 45 15 * * 1-5', function () {
        // every friday at 15:45 to do MOD
      }, null, true, 'Asia/Ho_Chi_Minh').start()
      new CronJob('00 00 23 * * *', function () {

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
