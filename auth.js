const jwt = require('jsonwebtoken')
const User = require('./db')
const express = require('express')
const bcrypt = require('bcrypt');
const {dispatchUsers} = require('./index')
const app = express()


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
  console.log("body",req.body);
  
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
        .then (dispatchUsers)
        .catch(err => {
          console.error(err)
          res.status(500).send({
            message: 'Something went wrong'
          })
        })
      res.send({
        jwt: toJWT({ userId: 1 })
      })
    }
  })
  
  
  app.get('/secret-endpoint', auth, (req, res) => {
    res.send({
      message: `Thanks for visiting the secret endpoint ${req.user.email}.`,
    })
  })