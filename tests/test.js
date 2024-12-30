const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Logger = require('./../routes/util/logController').Logger

const TimeUtil = require('../routes/util/TimeUtil')
const StockController = require('../routes/stock/stockController')
const Crawler = require('../routes/service/crawler')
const { Stock, StockTransaction } = require('../models/stock')
const RedisService = require('../routes/service/redisService');

dotenv.config();
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

mongoose.Promise = global.Promise
mongoose.set('strictQuery', false)
mongoose.pluralize(null);
mongoose.connect(process.env.MONGODB).then(async () => {
    console.log('done connect db')
    const listStock = await Stock.find().lean()
    for (let index = 0; index < listStock.length; index++) {
        const element = listStock[index];
        console.log(element.symbol)
        const model = mongoose.model(`stock_transaction_${element.symbol}`, schema)
        //remove collection
        await mongoose.connection.db.dropCollection(`stock_transaction_${element.symbol}`)
    }
    console.log('done')
})
