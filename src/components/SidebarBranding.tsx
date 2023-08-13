import React from 'react'
import { Box } from '@adminjs/design-system'
import { ViewHelpers, useCurrentAdmin } from 'adminjs'
const h = new ViewHelpers()
const SidebarBranding = () => {
    const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()
    return(
        <Box 
        flex={true}
  alignItems= "center"
  justifyContent= "center"
   py= "xl"
   style={currentAdmin.theme == 'dark' ? {backgroundColor: 'black'} : {backgroundColor: 'white'}}
        >
            <a href={h.dashboardUrl()}><img src='/asset/logotype.png' alt='Aspect | Instep'></img></a>
        </Box>
    )
}

export default SidebarBranding;