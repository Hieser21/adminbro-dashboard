import { ComponentLoader } from 'adminjs';
const componentLoader = new ComponentLoader();
const Component = {
    Dashboard: componentLoader.add('Dashboard', './my-dashboard-component'),
    TopBar: componentLoader.override('TopBar', './navbar'),
    SidebarBranding: componentLoader.override('SidebarBranding', './SidebarBranding')
};
export { componentLoader, Component };
