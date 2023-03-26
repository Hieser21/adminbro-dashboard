import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  encryptedPassword: {
    type: String,
    required: true
  },
  role: { type: String, enum: ['admin','general'], required: true },
  isBanned: {type: Boolean, required: true}
},

{
  timestamps: true
})

const Users = mongoose.model('Users', UserSchema)

export default Users
