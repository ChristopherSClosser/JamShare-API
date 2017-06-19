'use strict'

const cors = require('cors')
const dotenv = require('dotenv')
const morgan = require('morgan')
const express = require('express')
const Promise = require('bluebird')
const mongoose = require('mongoose')
const debug = require('debug')('jamshare-api:sever')

dotenv.load()

mongoose.Promise = Promise
mongoose.connect(process.env.MONGODB_URI)

const PORT = process.env.PORT
const app = express()

app.use(cors())
let production = process.env.NODE_ENV === 'production'
let morganFormat = production ? 'common' : 'dev'
app.use(morgan(morganFormat))

app.use(authRouter)
app.use(errorMiddleware)
// app.use(picRouter)
// app.use(galleryRouter)

const server = module.exports = app.listen(PORT , () => {
  debug(`server up on ${PORT}`)
})

server.isRunning = true
