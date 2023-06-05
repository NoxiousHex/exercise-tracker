const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose")
const mongoAccess = process.env['MONGO_URI']
mongoose.connect(mongoAccess)
const Schema = mongoose.Schema
const bodyParser = require("body-parser")
const uuid = require('node-uuid')

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


// API logic

// Create a schema for user
const userSchema = new Schema({
  usename: { type: String, required: true },
  _id: { type: String, required: true }
})
const User = mongoose.model("User", userSchema)
// temp user array
let users = []

// parse POST request body
app.use(bodyParser.urlencoded({extended: false}))

// respond to user POST request
app.post("/api/users", function(req, res) {
  const username = req.body.username
  const id = uuid.v4()
  const userObj = {username: username, _id: id, log:[], count: 0}
  if (!users.find(obj => obj.username === username)) {
     users.push(userObj) 
  }
  res.json(userObj)
})

app.get("/api/users", function(req, res) {
  res.json(users)
})

// respond to exercise POST req

app.post("/api/users/:id/exercises", (req, res) => {
  const id = req.params.id
  const description = req.body.description
  const duration = parseInt(req.body.duration)
  const date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  const exerciseObj = { description: description, duration: duration, date: date }
  const userObj = users.find(obj => obj._id === id)
  const newUserObj = {username: userObj.username, _id: userObj._id, ...exerciseObj}
  users = users.map(obj => obj._id === id ? {...obj, count: obj.count + 1, log: [...obj.log, exerciseObj]} : obj)
  res.json(newUserObj)
})

// respond to log GET request

app.get("/api/users/:id/logs", (req, res) => {
  const id = req.params.id
  console.log(req.query)
  let userObj = users.filter(obj => obj._id === id)
  if (req.query.from || req.query.to) {
    const from = req.query.from
    const to = req.query.to
    userObj = userObj.map(obj => {
       const filteredLogs = obj.log.filter(logObj => new Date(logObj.date).toLocaleDateString("en-CA") >= from && new Date(logObj.date).toLocaleDateString("en-CA") <= to)
      const newCount = filteredLogs.length
       return {...obj, log: filteredLogs, count: newCount}
     }) 
  }
  else if (req.query.limit) {
    const limit = req.query.limit
    userObj.map(obj => {
      const filteredLogs = obj.slice(0, limit)
      return {...obj, log: filteredLogs, count: limit}
    })
  }
  res.json(userObj[0])
})