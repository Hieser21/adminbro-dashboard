import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  subscription: {
    required: false,
    type: String,
    enum: ['lite','pro']
  },
  isActive: {
    required: false,
    type: String,
    enum: ['Active', 'Offline']
  },
  encryptedPassword: {
    type: String,
    required: true
  },
  game: { type: String},
  role: { type: String, enum: ['Admin','General', 'Developer'], required: true },
  isBanned: {type: Boolean, required: true}
},

{
  timestamps: true
})

const Users = mongoose.model('Users', UserSchema)

export default Users
