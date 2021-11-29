const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose = require("mongoose")
mongoose.connect("mongodb+srv://lk:lk@cluster0.dnqk5.mongodb.net/test?retryWrites=true&w=majority", {}).then(() => {
  console.log("connected")
}).catch((err) => { console.log(err) })

const exerciseUserSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: {
        type: String,
        default: new Date().toDateString()
      }
    }
  ]
})

const usermodel = mongoose.model("user", exerciseUserSchema)

app.post("/api/users", async (req, res) => {

  // console.log(req.body)
  if (req.body.username === null) {
    res.status(400).send("Path `username` is required.")
  }
  try {
    const mydata = new usermodel({
      username: req.body.username,

    })
    mydata.save().then((response) => {
      console.log("saved")
      let userdata = {
        username: response.username,
        _id: response._id
      }
      res.send(userdata)
    }).catch((err) => { console.log(err) })

  } catch (err) {
    console.log(err)
  }

})

app.get("/api/users", async (req, res) => {
  const user = await usermodel.find()
  if (user) {
    let userdata = []
    user.forEach(element => {
      userdata.push({
        username: element.username,
        _id: element._id
      })
    })
    res.send(userdata)
  }
  else {

    res.send("no user")
  }
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  let userid = req.params._id

  let myregex = new RegExp("^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$")
  if (req.body.description === null) {
    res.status(400).send("Path `description` is required.")
  }
  else if (req.body.duration === null) {
    res.status(400).send("Path `duration` is required.")
  }

  try {
    if (req.body.date !== null) {
      if (myregex.test(req.body.date)) {
        res.status(400).send("date format is not correct")
      }
      else {
        const user = await usermodel.findById(userid)
        if (user) {
          user.log.push({
            description: req.body.description,
            duration: req.body.duration,
            date: req.body.date
          })
          user.count = user.log.length
          user.save().then((response) => {
            console.log("updated")
            let userdata = {
              username: response.username,
              _id: response._id,
              date: response.log[response.log.length - 1].date,
              description: response.log[response.log.length - 1].description,
              duration: response.log[response.log.length - 1].duration
            }
            res.send(userdata)
          }).catch((err) => { console.log(err) })
        }
        else {
          res.send("no user")
        }
      }
    }
    else {
      const user = await usermodel.findById(userid)
      if (user) {
        user.log.push({
          description: req.body.description,
          duration: req.body.duration,
          date: new Date().toDateString()
        })
        user.count = user.log.length
        user.save().then((response) => {
          console.log("updated")
          let userdata = {
            username: response.username,
            _id: response._id,
            date: response.log[response.log.length - 1].date,
            description: response.log[response.log.length - 1].description,
            duration: response.log[response.log.length - 1].duration
          }
          res.send(userdata)
        }).catch((err) => { console.log(err) })
      }
      else {
        res.send("no user")
      }
    }
  } catch (error) {
    console.log(error)
  }


})
app.get("/api/users/:_id/logs", async (req, res) => {
  if (req.params._id === null) {
    res.status(400).send("id required")
  }
  try {
    const user = await usermodel.findById(req.params._id)
    if (user) {
      let userdata = {
        username: user.username,
        _id: user._id,
        count: user.count,
        log: user.log.map(element => {
          return {
            description: element.description,
            duration: element.duration,
            date: element.date
          }
        })
      }

      res.send(userdata)
    }

  } catch (error) {
    console.log(error)
  }



})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

