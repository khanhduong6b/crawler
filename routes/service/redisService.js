require('dotenv').config({ path: __dirname + '../../.env' });
const Logger = require('./../util/logController').Logger
const redis = require('redis')
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
})

function RedisService() {
  return {
    storeTokenInRedis: function (key, value) {
      return new Promise((resolve, reject) => {
        key = 'stock_' + key
        if (!value) {
          client.del(key)
          return resolve()
        } else {
          client.set(key, value, function (error) {
            if (error) return reject(error)
            return resolve()
          })
        }
      })
    },
    receiveTokenInRedis: async function (key) {
      try {
        const reply = await client.get('stock_' + key)
        return Promise.resolve(reply)
      } catch (error) {
        Logger.error(`receiveTokenInRedis - fail: `, error.stack)
        return Promise.reject(error)
      }
    },
    verifyTokenInRedis: function (playerId, token, callback) {
      client.eval("return redis.call('get', ARGV[1]) == ARGV[2]", 0, 'yteco_' + playerId, token, (error, response) => {
        if (error) Logger.info(error)
        else callback(response === 1)
      })
    },
    getDataByKey: (key) => {
      return new Promise((resolve, reject) => {
        client.get(key, (err, data) => {
          if (err) {
            Logger.error(`getDataByKey - key: ${key} - fail: ${err.stack}`)
            return reject(err)
          }
          return resolve(data)
        })
      })
    },
    setDataByKey: (key, value, expTime = null) => {
      return new Promise((resolve, reject) => {
        client.set(key, value, (err, result) => {
          if (err) {
            Logger.error(`setDataByKey - key: ${key} - fail: ${err.stack}`)
            return reject(err)
          }
        })
        if (expTime) {
          client.expire(key, expTime)
        }
        return resolve()
      })
    },
    clearDataByKey: async (key) => {
      client.del(key)
      return Promise.resolve()
    },
    initConnection: async () => {
      client.on('error', function (err) {
        Logger.info(`Error on connect Redis ${err}`)
      }).connect().then(() => {
        Logger.info(`Connected to Redis`)
      }).catch(e => {
        Logger.error(`Connected to Redis fail: `, e)
      })
    }
  }
}
module.exports = new RedisService()
