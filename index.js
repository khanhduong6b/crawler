const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require('body-parser');
const RedisService = require('./routes/service/redisService')
const SchedulerTask = require('./routes/util/schedulerTask')
dotenv.config();
const app = express();

app.use(cors());
app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const routes = require("./routes/home");
app.use("/v1/api", routes);

RedisService.initConnection()

mongoose.Promise = global.Promise
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGODB).then(() => {
    app.listen(process.env.WEB_PORT, async () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${process.env.WEB_PORT}`);
      await RedisService.clearDataByKey('access_token')
      SchedulerTask.allTask()
  });
})

