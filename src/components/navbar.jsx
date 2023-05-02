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
  const filePath = `${currentAdmin.name}%2F${currentAdmin.role}.png`
  currentAdminUser = currentAdmin
  return (
    <Box
    border='0px'
    flex
    flexDirection='row-reverse'
    height='navbarHeight'
    style={currentAdmin.theme == 'dark' ? {backgroundColor:'#281A4F', color: 'white', border: '2px solid black'}: {backgroundColor:'white', color: '#0d1318'}}
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
        avatarUrl={`https://firebasestorage.googleapis.com/v0/b/dashboard-d7e5d.appspot.com/o/${filePath}?alt=media`}
      />
    </Box>
  )
}
export { currentAdminUser, toggler }
export default TopBar