import express from 'express'
import bcrypt from 'bcrypt'
import Users from './db/Users'
import mongoose from 'mongoose'
import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import adminBroOptions from './adminbro-options'
import {default as MongoStore} from 'connect-mongo'
require('dotenv').config()
const sessionStore = MongoStore.create({
  mongoUrl: 'mongodb+srv://Bot:rattlesnake20@cluster0.ehnrp.mongodb.net/mern?retryWrites=true&w=majority',
  ttl: 14 * 24 * 60 * 60,
  autoRemove: 'native'
})

const cookie = process.env.COOKIE_PASSWORD
const router = AdminJSExpress.buildAuthenticatedRouter(new AdminJS(adminBroOptions), {
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
  saveUninitialized: true,
  resave: true,
  secret: 'sessionsecret',
  
  cookie: {
  httpOnly: process.env.NODE_ENV !== 'prodcution',
    secure: process.env.NODE_ENV !== 'production',
    maxAge: 24 * 60 * 14 * 60
  },
  store: sessionStore
},

)

const app = express()
app.use(adminBroOptions.rootPath, router)
app.use("/asset", express.static("public"))


app.get('/', function(req, res) { res.redirect('/admin')})
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
