import AdminJS, { Dashboard } from 'adminjs'
import { ComponentLoader } from 'adminjs'

import AdminJSMongoose, { Resource } from '@adminjs/mongoose'
import bcrypt from 'bcrypt'
import Users from './db/Users'
import Reports from './db/Reports'
import Announce from './db/Announce'
import Exploiter from './db/Exploiter'
const componentLoader = new ComponentLoader()
const beforeAction = (request, context) => {
  if (context.currentAdmin.role !== 'Developer') {
    const { query = {} } = request

    const newQuery = {
      ...query,
      ['filters.placeid']: context.currentAdmin.placeid,
    }

    request.query = newQuery

    return request
  }
  else {
    return request
  }
}
const Component = {
  Dashboard: AdminJS.bundle('./components/my-dashboard-component'),
  TopBar: AdminJS.bundle('./components/navbar', 'TopBar')
};
AdminJS.registerAdapter(AdminJSMongoose)
const contentNavigation = {
  name: 'Logs',
  icon: 'Dashboard'
}
const canModifyUsers = ({ currentAdmin }: any) => currentAdmin && currentAdmin.role === 'Developer'
const canEditReports = ({ currentAdmin }: any) => currentAdmin && currentAdmin.role === 'Developer'



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
          list: {
            isAccessible: canModifyUsers
          },
          new: {
            before: async (request: any) => {
              if (request.payload.password) {
                request.payload = {
                  ...request.payload,
                  encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                  password: undefined
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
                  encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                  password: undefined
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
      resource: Exploiter,
      options: {
        navigation: contentNavigation,
        properties: {
          _id: { isVisible: false },
          exploited: { isVisible: { list: true, filter: true, show: true, edit: true } },
          createdAt: { isVisible: { list: true, filter: true, show: true, edit: true } }
        },
       actions: {
          list: {
            before: beforeAction
          },
          new: {

            isAccessible: canEditReports
          },
          edit: {
            isAccessible: canEditReports

          },
          delete: { isAccessible: canModifyUsers }
        }
      }
    },
    {
      resource: Reports,
      options: {
        navigation: contentNavigation,
        properties: {
          updatedAt: {
            isVisible: { list: false, show: false, edit: false }
          }
        },
        actions: {
          list: {
            before: beforeAction
          },
          new: {

            isAccessible: canEditReports
          },
          edit: {
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
            isVisible: { list: false, edit: false, show: true, filter: false }
          },
          updatedAt: {
            isVisible: { list: false, show: false, edit: false }
          }
        },
        actions: {
          new: {
            isAccessible: canEditReports
          },
          delete: { isAccessible: canEditReports },
          edit: { isAccessible: canEditReports }
        }
      }
    }
  ],

  locale: {
    language: 'en',
    translations: {
      properties: {
        password: 'Pass'
      },
      messages: {
        loginWelcome: 'Providing Innovative Security'
      },
      labels: {
        loginWelcome: 'Aspect Systems',
        Users: 'Customers',
        Announce: 'Announcements',
        Email: 'Email',
        Exploiter: 'Users'
      }
    }
  },
  dashboard: {
    handler: async (request, response, context) => {
      let res;
      res = await Reports.find().sort({ createdAt: -1 }).limit(3)
      let announce = await Announce.find().sort({ createdAt: -1 }).limit(3)
      let status = await Users.findOne({ email: context.currentAdmin?.email }, function (err, obj) { return obj })
      let subscription_type = await Users.findOne({ email: context.currentAdmin?.email }, function (err, obj) { return obj })
      let user = await Users.findOne({ email: context.currentAdmin?.email }, function (err, obj) { return obj })
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
      icon: 'Terminal'
    },

  },

  rootPath: '/admin',

  branding: {
    companyName: 'Aspect | Instep',
    theme: {
      colors: {
        primary100: '#6844CE',
        hoverBg: '#cec2ef'
      }
    },
    withMadeWithLove: false,
    logo: "https://media.discordapp.net/attachments/1041025455144308816/1089434600872361984/Logo_mark_variant_4.png?width=114&height=115",
    favicon: "https://cdn.discordapp.com/attachments/926498420011708427/1089225269887389726/Logo_mark_variant_4.ico"

  },
  assets: {
    styles: ['/asset/style.css']
  }
})

export default adminBroOptions
