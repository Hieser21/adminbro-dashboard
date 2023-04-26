import { CurrentUserNav, Box} from '@adminjs/design-system'
import { useCurrentAdmin } from 'adminjs'
import {useSelector} from 'react-redux'
let currentAdminUser;
let toggler;

const TopBar = (props) => {
  const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()
  const { toggleSidebar } = props
  toggler = toggleSidebar  
  const [session, paths, versions] = useSelector(
    (state) => [
      state.session,
      state.paths,
      state.versions,
    ],
  )
  currentAdminUser = currentAdmin
  return (
    <Box
    border='0px'
    flex
    flexDirection='row-reverse'
    height='navbarHeight'
    className='topbar'
    >
      <CurrentUserNav
        dropActions={[
          {
            icon: 'LogOut',
            label: 'Log out',
            href: '/admin/logout',
            onClick: function noRefCheck() { }
          }
        ]}
        lineActions={[
          {
            icon: 'ArrowRight',
            label: 'Sidebar',
            onClick: toggleSidebar,
            
          },
          {
            icon: 'AlertCircle',
            label: 'Help',
            href: 'https://discord.gg/FrxXABtE',
            onClick: function noRefCheck() { }
          },
          
        ]}
        name={currentAdmin.name}
        title={currentAdmin.role}
        avatarUrl={'/asset/files/' + currentAdmin.name + '/' + currentAdmin.role + '.png'}
      />
    </Box>
  )
}
export { currentAdminUser, toggler }
export default TopBar