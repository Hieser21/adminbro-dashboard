import AdminJS, { Dashboard } from 'adminjs'
import {ComponentLoader} from 'adminjs'
import AdminJSMongoose, { Resource } from '@adminjs/mongoose'
import bcrypt from 'bcrypt'
import Users from './db/Users'
import Reports from './db/Reports'
import Announce from './db/Announce'
import {CurrentAdmin} from 'adminjs'

const componentLoader = new ComponentLoader()
const Component = {
  Dashboard: AdminJS.bundle('./components/my-dashboard-component')
};
AdminJS.registerAdapter(AdminJSMongoose)
const contentNavigation = {
  name: 'Components',
  icon: 'Dashboard'
}
const canModifyUsers = ({ currentAdmin }: any) => currentAdmin && currentAdmin.role === 'admin'
const canEditReports = ({currentAdmin}: any) => currentAdmin && currentAdmin.role === 'admin'



const adminBroOptions = new AdminJS({
  resources: [
    {
      resource: Users,
      options: {
        navigation: contentNavigation,
        properties: {
          email: { isVisible: { list: true, filter: true, show: true, edit: true }, type: 'email' },
          encryptedPassword: { isVisible: false, type: 'password' },
          password: {
            type: 'password',
            isVisible: {
              list: false, edit: true, filter: false, show: false
            }
          },
          updatedAt: { isVisible: { list: true, filter: true, show: true, edit: false } },
          createdAt: { isVisible: { list: true, filter: true, show: true, edit: false } }
        },
        actions: {
          new: {
            before: async (request) => {
              if(request.payload.password) {
                request.payload = {
                  ...request.payload,
                  encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                  password: undefined,
                }
              }
              return request
            },
            isAccessible: canModifyUsers
          },
          edit: {
            before: async (request: any) => {
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  encryptedPassword: await bcrypt.hash(request.payload.password, 10)
                }
              }
              return request
            },
            isAccessible: canModifyUsers
          },
          delete: { isAccessible: canModifyUsers }
        }
      }
    },
  {
    resource: Reports,
    options: {
      navigation: contentNavigation,
      actions: {
                new: {
                  before: async (request) => {
                    if(request.payload.password) {
                      request.payload = {
                        ...request.payload,
                        encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                        password: undefined,
                      }
                    }
                    return request
                  },
                  isAccessible: canEditReports
                },
                edit: {
                  before: async (request: any) => {
                    if (request.payload.password) {
                      request.payload = {
                        ...request.payload,
                        encryptedPassword: await bcrypt.hash(request.payload.password, 10)
                      }
                    }
                    return request
                  },
                  isAccessible: canEditReports
                
                },
                delete: { isAccessible: canModifyUsers }
              }
    },
  },
  {
    resource: Announce,
    options: {
      navigation: contentNavigation,
      properties: {
        _id: {
          isVisible: {list: false, edit: false, show: true, filter: false}
        }
      },
      actions: {
        new: {
          isAccessible: canEditReports
        },
        delete:{isAccessible: canEditReports},
        edit: {isAccessible: canEditReports}
      }
    }
  } 
   ],
  locale: {
    language: 'en',
    translations: {
      messages: {
        loginWelcome: 'Providing Innovative Security'
      },
      labels: {
        loginWelcome: 'Aspect',
        Users: 'Users',
        Announce: 'Announcements'
      }
    }
  },
  dashboard: {
    handler: async (request, response, context) => {
      let res;
      res = await Reports.find().sort({ createdAt: -1 }).limit(3)
      let announce = await Announce.find().sort({createdAt: -1}).limit(3)
      let status = await Users.findOne({email: context.currentAdmin?.email}, function(err,obj){return obj})
      let subscription_type = await Users.findOne({email: context.currentAdmin?.email}, function(err,obj){return obj})
      let user = await Users.findOne({email: context.currentAdmin?.email}, function(err, obj){ return obj})
      return { 
        stat: status,
        logs: res,
        ping: announce,
        user: user,
        subscription_type: subscription_type
      };
    },
    component: Component.Dashboard
  },
  pages: {
    'Dashboard': {
      component: AdminJS.bundle('./components/my-dashboard-component'),
      icon: 'Dashboard'
    },
    "Settings": {
      component: componentLoader.add('Settings','./components/settings'),
      icon: 'Settings',
      handler: async function(request, response){
        return {
          text:"Data"
        }
      }
    },
  },

  rootPath: '/admin',
  branding: {
    companyName: 'Aspect | Instep',
    theme: { colors: {
    } },
    withMadeWithLove: false,
    logo:  "https://media.discordapp.net/attachments/1041025455144308816/1089434600872361984/Logo_mark_variant_4.png?width=114&height=115",
    favicon: "https://cdn.discordapp.com/attachments/926498420011708427/1089225269887389726/Logo_mark_variant_4.ico"
    
  },
  assets: {
    styles: ['/asset/style.css']
  }
})

export default adminBroOptions
