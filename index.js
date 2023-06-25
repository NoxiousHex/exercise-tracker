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
const moment = require('moment')

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
  username: { type: String, required: true },
  _id: { type: String, required: true },
  log: { type: [{}], required: true },
  count: { type: Number, required: true }
})
const User = mongoose.model("User", userSchema)

// DB functions
const createUser = async function(username, id, log = [], count = 0) {
  try {
    const newUser = new User({ username: username, _id: id, log: log, count: count })

    await newUser.save()
  }
  catch (err) {
    console.error(err)
  }
}

const findUser = async function(userName) {
  try {
    const userFound = await User.findOne({ username: userName })

    return userFound
  }
  catch (err) {
    console.error(err)
  }
}

const findUserById = async function(id) {
  try {
    const userFound = await User.findById(id)
    return userFound
  }
  catch(err) {
    console.error(err)
  }
}

const findAllUsers = async function() {
  try {
    const users = await User.find()

    return users
  }
  catch (err) {
    console.error(err)
  }
}

const addExercise = async function(id, exercise) {
  const user = await findUserById(id)
  const username = user.username
  const newExercises = [...user.log, exercise]
  const count = user.count

  try {
    const updatedUser = await User.findByIdAndUpdate(id, { log: newExercises, count: count +      1 })
  }
  catch(err) {
    console.error(err)
  }
}

// parse POST request body
app.use(bodyParser.urlencoded({ extended: false }))

// respond to user POST request
app.post("/api/users", async function(req, res) {
  const username = req.body.username
  const id = uuid.v4()

  if (!await findUser(username)) {
    createUser(username, id)
  }

  res.json(await findUser(username))
})

app.get("/api/users", async function(req, res) {
  const users = await findAllUsers()
  res.json(users)
})

// respond to exercise POST req

app.post("/api/users/:id/exercises", async (req, res) => {
  const id = req.params.id
  const description = req.body.description
  const duration = parseInt(req.body.duration)
  const date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  const exerciseObj = { description: description, duration: duration, date: date }
  await addExercise(id, exerciseObj)
  res.json(await findUserById(id))
})

// respond to log GET request

app.get("/api/users/:id/logs", async (req, res) => {
  const id = req.params.id
  const userObj = await findUserById(id)

  if (req.query.from || req.query.to) {
    const from = req.query.from || "1970-01-01"
    const to = req.query.to || "2100-01-01"
    const filteredLogs = userObj.log.filter(logObj => {
      const rawDate = new Date(logObj.date)
      const date = moment(rawDate).format("YYYY-MM-DD")
      if (date >= from && date <= to) {
        return true
      }
      else return false
    })
    userObj["log"] = filteredLogs
    userObj["count"] = filteredLogs.length
  }

  if (req.query.limit) {
    const limit = req.query.limit
    const filteredLogs = userObj.log.slice(0, limit)
    userObj["log"] = filteredLogs
    userObj["count"] = filteredLogs.length
  }
  res.json(userObj)
})
