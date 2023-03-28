import express from 'express'
import bcrypt from 'bcrypt'
import Users from './db/Users'
import mongoose from 'mongoose'
import AdminJSExpress from '@adminjs/express'
import adminBroOptions from './adminbro-options'
import AdminJS from 'adminjs/types/src'


require('dotenv').config()

const cookie = process.env.COOKIE_PASSWORD
const router = AdminJSExpress.buildAuthenticatedRouter(adminBroOptions, {
  authenticate: async (email: any, password: any) => {
    const user = await Users.findOne({ email })
    if (user) {
      const matched = await bcrypt.compare(password, user.encryptedPassword)
      if (matched) {
        return user
      }
    }
    return false
  },
  cookiePassword: `${cookie}`
})

const app = express()
app.use(adminBroOptions.options.rootPath, router)
app.use("/asset",express.static("public"))


app.get('/', (req, res) => {res.redirect('/admin')})
const run = async () => {
  await mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ehnrp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  }).then(function(){
    console.log('DB connected')
  })

  await app.listen(8080)
}

run()
