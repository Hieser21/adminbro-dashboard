import AdminBro from 'admin-bro'
import AdminBroMongoose, { Resource } from '@admin-bro/mongoose'
import bcrypt from 'bcrypt'
import Users from './db/Users'

AdminBro.registerAdapter(AdminBroMongoose)
const contentNavigation = {
  name: 'Dashboard',
  icon: 'Dashboard'
}
const canModifyUsers = ({ currentAdmin }: any) => currentAdmin && currentAdmin.role === 'admin'
const canEditReports = ({currentAdmin}: any) => currentAdmin && currentAdmin.role === 'admin'



const adminBroOptions = new AdminBro({
  // resources: [
  //   {
  //     resource: Users,
  //     options: {
  //       navigation: contentNavigation,
  //       properties: {
  //         email: { isVisible: { list: true, filter: true, show: true, edit: true }, type: 'email' },
  //         encryptedPassword: { isVisible: false, type: 'password' },
  //         password: {
  //           type: 'password',
  //           isVisible: {
  //             list: false, edit: true, filter: false, show: false
  //           }
  //         },
  //         updatedAt: { isVisible: { list: true, filter: true, show: true, edit: false } },
  //         createdAt: { isVisible: { list: true, filter: true, show: true, edit: false } }
  //       },
  //       actions: {
  //         new: {
  //           before: async (request) => {
  //             if(request.payload.password) {
  //               request.payload = {
  //                 ...request.payload,
  //                 encryptedPassword: await bcrypt.hash(request.payload.password, 10),
  //                 password: undefined,
  //               }
  //             }
  //             return request
  //           },
  //         },
  //         edit: {
  //           before: async (request: any) => {
  //             if (request.payload.password) {
  //               request.payload = {
  //                 ...request.payload,
  //                 encryptedPassword: await bcrypt.hash(request.payload.password, 10)
  //               }
  //             }
  //             return request
  //           },
  //         },
  //         delete: { isAccessible: canModifyUsers }
  //       }
  //     }
  //   },
  // ],
  locale: {
    language: 'en',
    translations: {
      messages: {
        loginWelcome: 'blank'
      },
      labels: {
        loginWelcome: 'test',
        Users: 'Users',
        Cotations: 'Cotations'
      }
    }
  },
  dashboard: {
    handler: async (request, response) => {
      return { 
        text: 'Hieser',
        subscription: 'Instep Pro' ,
        stat: 'active'
      };
    },
    component: AdminBro.bundle('./components/my-dashboard-component')
  },
  pages: {
    'Dashboard': {
      component: AdminBro.bundle('./components/my-dashboard-component'),
      icon: 'Dashboard'
    },
    "Settings": {
      component: AdminBro.bundle('./components/settings'),
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
    bg: '#6844CE'
    } },
    softwareBrothers: false,
    logo:  "https://media.discordapp.net/attachments/1041025455144308816/1089434600872361984/Logo_mark_variant_4.png?width=114&height=115",
    favicon: "https://cdn.discordapp.com/attachments/926498420011708427/1089225269887389726/Logo_mark_variant_4.ico"
    
  },
  assets: {
    styles: ['https://cdn.discordapp.com/attachments/1041025455144308816/1089481951305531432/style_1.css']
  }
})

export default adminBroOptions
