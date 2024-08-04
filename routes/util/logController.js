const winston = require('winston')
const format = winston.format
const myFormat = format.printf(info => {
  const data = {timestamp: new Date(info.timestamp).toLocaleString(), message: info.message}
  return `${JSON.stringify(data)}`
})
winston.loggers.add('default', {
  transports: [
    new winston.transports.File({
      maxsize: 10000000, /*10MB*/
      filename: __dirname + '/../../logs/log.log',
      format: format.combine(format.timestamp(), myFormat)
    }),
    new winston.transports.Console({
      format: format.combine(format.timestamp(), myFormat)
    })
  ]
})
winston.loggers.add('scheduler', {
  transports: [
    new winston.transports.File({
      maxsize: 10000000, /*10MB*/
      filename: __dirname + '/../../logs/scheduler.log',
      format: format.combine(format.timestamp(), myFormat)
    }),
    new winston.transports.Console({
      format: format.combine(format.timestamp(), myFormat)
    })
  ]
})
module.exports = {
  Logger: winston.loggers.get('default'),
  Scheduler: winston.loggers.get('scheduler')
}