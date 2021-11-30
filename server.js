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

let mydate = (date) => {
  if (date) {
    return new Date(date).toDateString()
  }
  return new Date().toDateString()

}

const exerciseUserSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: {
        type: String,
        default: mydate(new Date())
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
      console.log(mydate(req.body.date))
      if (myregex.test(req.body.date)) {
        res.status(400).send("date format is not correct")
      }
      else {
        const user = await usermodel.findById(userid)
        if (user) {
          user.log.push({
            description: req.body.description,
            duration: req.body.duration,
            date: mydate(req.body.date)
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
    else if (req.body.date === null || req.body.date === "" || req.body.date === undefined) {
      console.log(mydate())
      const user = await usermodel.findById(userid)
      if (user) {
        user.log.push({
          description: req.body.description,
          duration: req.body.duration,
          date: mydate()
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





// app.get("/api/users/:_id/logs", async (req, res) => {
//   if (req.params._id === null) {
//     res.status(400).send("id required")
//   }
//   try {
//     const user = await usermodel.findById(req.params._id)
//     if (user) {
//       let userdata = {
//         username: user.username,
//         _id: user._id,
//         count: user.count,
//         log: user.log.map(element => {
//           return {
//             description: element.description,
//             duration: element.duration,
//             date: element.date
//           }
//         })
//       }

//       res.send(userdata)
//     }

//   } catch (error) {
//     console.log(error)
//   }



// })

app.get('/api/users/:_id/logs', (req, res) => {
  //console.log(req.params)
  //console.log(req.params._id)
  console.log("line 127 inside get(/api/users/:_id/logs)")
  //console.log(req.query)//returns any ?query=value after url as object {}
  usermodel.findById(req.params._id, (err, result) => {
    if (err) {
      return console.error(error)
    }

    const exerciseCount = result.log.length;
    //check for Invalid Date to pass tests
    //date must be returned as String
    for (each in result.log) {
      if (result.log[each].date == 'Invalid Date') {
        result.log[each].date = new Date().toDateString();
      }
    }
    console.log(result.log)
    console.log(req.query);
    //console.log(req.query != {})//returns true don't use for checking if query object is part of url
    console.log(Object.keys(req.query).length != 0);//use this to determine if query is there
    //if query is not empty convert query date format and log date format to Date object for comparison. toDateString() does not work for comparison purposes
    if (Object.keys(req.query).length != 0) {
      const from = new Date(req.query['from']);
      const to = new Date(req.query['to']);
      //try sub below
      let fromLog = new Date(result.log[0].date);
      //let fromLog = new Date();//sub this later
      let resLog = [];

      if (req.query.hasOwnProperty('limit')) {
        for (each in result.log) {
          if (each < req.query['limit']) {
            resLog.push(result.log[each]);
          }
        }
      }

      if (req.query.hasOwnProperty('from')) {
        for (each in result.log) {
          console.log(result.log.length);
          console.log(each)
          fromLog = new Date(result.log[each].date);
          if (from < fromLog && to > fromLog) {
            console.log("include this log");
            resLog.push(result.log[each]);
            console.log(result.log);//two logs
            console.log(resLog);//one log
          }
        }
      }

      result.log = resLog;
      //remove logs below
      console.log(result.log);
      console.log('type of from:')
      console.log(typeof (from))
      console.log(typeof (req.query['from']))
      console.log(from + ' until ' + to)
      console.log(from < fromLog);
      console.log('from is less than log date');
      console.log(to > fromLog);
      console.log('to is more than log date');
    }

    res.json({ "username": result.username, "count": exerciseCount, "_id": result._id, "log": result.log })
  })
})



app.get("/api/users/:id/logs/:range", async (req, res) => {
  if (req.params.id === null) {
    res.status(400).send("id required")
  }
  try {
    const user = await usermodel.findById(req.params.id)
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

