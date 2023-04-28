import React from 'react';
import { Box } from '@adminjs/design-system';
import { ViewHelpers, useCurrentAdmin } from 'adminjs';
const h = new ViewHelpers();
const SidebarBranding = () => {
    const [currentAdmin, setCurrentAdmin] = useCurrentAdmin();
    return (React.createElement(Box, { flex: true, alignItems: "center", justifyContent: "center", py: "xl", style: currentAdmin.theme == 'dark' ? { backgroundColor: 'black' } : { backgroundColor: 'white' } },
        React.createElement("a", { href: h.dashboardUrl() },
            React.createElement("img", { src: '/asset/logotype.png', alt: 'Aspect | Instep' }))));
};
export default SidebarBranding;
