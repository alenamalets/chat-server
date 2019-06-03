const Sequelize = require('sequelize')

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/postgres'
const sequelize = new Sequelize(connectionString, {define: { timestamps: false }})

sequelize.sync()
  .then(() => {
    console.log('Sequelize updated database schema')
  })
  .catch(console.error)

const Messages = sequelize.define( "messages", {
  name: {
  type: Sequelize.STRING,
  allowNull: false
},
  body: {
  type: Sequelize.STRING
},
}, {
timestamps: false,
tableName: 'messages'
})

const User = sequelize.define('users', {
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
}, {
  timestamps: false,
  tableName: 'users'
})


module.exports = {User, Messages}