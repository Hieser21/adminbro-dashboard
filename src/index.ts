import express from 'express'
import bcrypt from 'bcrypt'
import Users from './db/Users'
import mongoose from 'mongoose'
import AdminJSExpress from '@adminjs/express'
import adminBroOptions from './adminbro-options'
import { bundle } from '@adminjs/bundler'
import {default as MongoStore} from 'connect-mongo'
require('dotenv').config()
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  ttl: 14 * 24 * 60 * 60,
  autoRemove: 'native'
})

const cookie = process.env.COOKIE_PASSWORD
const router = AdminJSExpress.buildAuthenticatedRouter(adminBroOptions, {
  authenticate: async function(email: any, password: any){
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
}, null, {
  store: sessionStore,
  resave: true,
  saveUninitialized: true,
  secret: 'sessionsecret',
  cookie: {
    secure: process.env.NODE_ENV == 'production',
    sameSite: 'none',
    domain: 'dashboard-ci2b.onrender.com'
  }
},)

const app = express()
app.use(adminBroOptions.options.rootPath, router)
app.use("/asset", express.static("public"))


app.get('/', (req, res) => { res.redirect('/admin')})
const run = async () => {
  await mongoose.connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  }).then(function () {
    console.log('DB connected')
  })

  await app.listen(8080)
}

run()
