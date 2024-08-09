const mongoose = require('mongoose')

const Stock = mongoose.Schema({
    market: { type: String },
    symbol: { type: String },
    name: { type: String },
    enName: { type: String },
}, { versionKey: false, timestamps: true })

const StockTransaction = mongoose.Schema({
    symbol: { type: String, index: true },
    tradingDate: { type: String },
    time: { type: String },
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    volume: { type: Number },
}, { versionKey: false, timestamps: true })

module.exports = {
    Stock: mongoose.model('stock', Stock),
    StockTransaction: mongoose.model('stock_transaction', StockTransaction)
}
