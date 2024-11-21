'use strict'
const express = require('express')
const router = express.Router({})
const TrackingController = require('./tracking/trackingController')
const StockController = require('./stock/stockController')
//const fileUpload = require('express-fileupload');
//router.use(fileUpload());

//router.use(TrackingController.trackAccessUrl)
/**API USER */
router.get('/getAccessToken', StockController.getAccessToken)
router.get('/stock/getAllData', StockController.getAllData)
router.get('/stock/getNewData', StockController.getNewData)

module.exports = router
