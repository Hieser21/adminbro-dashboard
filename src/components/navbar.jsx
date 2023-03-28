import { CurrentUserNav, Box } from '@adminjs/design-system'
import {useCurrentAdmin} from 'adminjs'
const TopBar = () => {
  const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()
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

export default TopBar