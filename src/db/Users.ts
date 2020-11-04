export { }

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    require: true
  },
  createdAt: {
    default: Date.now(),
    type: Date
  }
})

UserSchema.pre('save', async function (next) {
  const hash = await bcrypt.hashSync(this.password, 10)
  this.password = hash

  next()
})

const Users = mongoose.model('Users', UserSchema)

module.exports = Users