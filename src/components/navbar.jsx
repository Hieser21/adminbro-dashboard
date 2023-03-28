import { CurrentUserNav, Box } from '@adminjs/design-system'
import {useCurrentAdmin} from 'adminjs'
let currentAdminUser;
const TopBar = () => {
  const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()
  currentAdminUser = currentAdmin
   return(
    <Box
      border="default"
      flex
      flexDirection="row-reverse"
      height="navbarHeight"
    >
      <CurrentUserNav
        dropActions={[
          {
            icon: 'Logout',
            label: 'Log out',
            href: '/admin/logout',
            onClick: function noRefCheck(){}
          }
        ]}
        lineActions={[
          {
            icon: 'Help',
            label: 'Help',
            href: 'https://discord.gg/FrxXABtE',
            onClick: function noRefCheck(){}
          },
        ]}
        name={currentAdmin.name}
        title={currentAdmin.title}
      />
    </Box>
    )
}
export {currentAdminUser} 
export default TopBar