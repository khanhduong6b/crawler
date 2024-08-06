'use strict'
const express = require('express')
const router = express.Router({})
const TrackingController = require('./tracking/trackingController')
const StockController = require('./stock/stockController')
const fileUpload = require('express-fileupload');
router.use(fileUpload());

router.use(TrackingController.trackAccessUrl)
/**API USER */
router.get('/getAllData', StockController.getAllData)
router.get('/getAccessToken', StockController.getAccessToken)

module.exports = router
