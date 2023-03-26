import express from 'express'
import bcrypt from 'bcrypt'
import Users from './db/Users'
import mongoose from 'mongoose'
import AdminBroExpress from '@admin-bro/express'
import adminBroOptions from './adminbro-options'


require('dotenv').config()


const router = AdminBroExpress.buildAuthenticatedRouter(adminBroOptions, {
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
  cookiePassword: process.env.COOKIE_PASSWORD
})

const app = express()
app.use(adminBroOptions.options.rootPath, router)
app.use(express.static('../public'))

app.get('/', (req, res) => {res.redirect('/admin')})
app.post('/support', (req, res) => {res.json(req.body).redirect('/admin/pages/Settings')})
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
