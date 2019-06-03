const express = require('express')
const socketIo = require('socket.io')
const cors = require('cors')
const bodyParser = require('body-parser')
const {User, Messages} = require('./db')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const app = express()

app.use(cors())
app.use(bodyParser.json())

app.post('/users', (req, res, next) => {
    const user = {
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 5)
    }
    User
    .create(user)
    .then(user => {
      if (!user) {
        return res.status(404).send({
          message: `User does not exist`
        })
      }
      return res.status(201).send(user)
    })
    .then (dispatchUsers)
    .catch(error => next(error))
})


function dispatchUsers() { 
    User.findAll()
      .then(users => {
        io.emit(
            'action',
            { type: 'USERS', payload: users } 
        )
      })
      .catch(error => next(error))
}

function dispatchMessages() { 
        Messages.findAll()
          .then(messages => {
            io.emit(
                'action',
                { type: 'MESSAGES', payload: messages } 
            )
          })
          .catch(error => next(error))
}

// app.post('/messages', (req, res) => {
//    const {message}  = req.body
//    console.log('message', message);
//    messages.push(message)
//    dispatchMessages()
//    res.send(message)  
// })
app.post('/messages', (req, res, next) => {
    Messages
    .create(req.body)
    .then(messages => {
      if (!messages) {
        return res.status(404).send({
          message: `messages does not exist`
        })
      }
      return res.status(201).send(messages)
    })
    .then (dispatchMessages)
    .catch(error => next(error))
    
})

function onListen() {
    console.log('Listening on port 4000');   
}
const server = app.listen(4000,onListen )

const io = socketIo.listen(server)

io.on('connection', client => {
    console.log('client.id test', client.id);  

dispatchMessages()
dispatchUsers()

client.on('disconnect', () => {
    console.log('disconnect test', client.id); 
})
})


const secret = process.env.JWT_SECRET || 'e9rp^&^*&@9sejg)DSUA)jpfds8394jdsfn,m'

function toJWT(data) {
  return jwt.sign(data, secret, { expiresIn: '2h' })
}

function toData(token) {
  return jwt.verify(token, secret)
}


function auth(req, res, next) {
    const auth = req.headers.authorization && req.headers.authorization.split(' ')
    if (auth && auth[0] === 'Bearer' && auth[1]) {
      try {
        const data = toData(auth[1])
        User
          .findById(data.userId)
          .then(user => {
            if (!user) return next('User does not exist')
  
            req.user = user
            next()
          })
          .catch(next)
      }
      catch(error) {
        res.status(400).send({
          message: `Error ${error.name}: ${error.message}`,
        })
      }
    }
    else {
      res.status(401).send({
        message: 'Please supply some valid credentials'
      })
    }
}



app.post('/logins', (req, res) => {  
    const email = req.body.email
    const password = req.body.password
  
    if (!email || !password) {
      res.status(400).send({
        message: 'Please supply a valid email and password'
      })
    }
    else {
      // 1. find user based on email address
      User
        .findOne({
          where: {
            email: req.body.email
          }
        })
        .then(entity => {
          if (!entity) {
            res.status(400).send({
              message: 'User with that email does not exist'
            })
          }
  
          // 2. use bcrypt.compareSync to check the password against the stored hash
          if (bcrypt.compareSync(req.body.password, entity.password)) {
  
            // 3. if the password is correct, return a JWT with the userId of the user (user.id)
            res.send({
              jwt: toJWT({ userId: entity.id })
            })
          }
          else {
            res.status(400).send({
              message: 'Password was incorrect'
            })
          }
        })
        .catch(err => {
          console.error(err)
          res.status(500).send({
            message: 'Something went wrong'
          })
        })
      // res.send({
      //   jwt: toJWT({ userId: 1 })
      // })
    }
  })
  
  
  app.get('/secret-endpoint', auth, (req, res) => {
    res.send({
      message: `Thanks for visiting the secret endpoint ${req.user.email}.`,
    })
  })