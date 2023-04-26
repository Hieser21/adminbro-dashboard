import { ComponentLoader } from 'adminjs'
const componentLoader = new ComponentLoader()
const Component = {
  Dashboard: componentLoader.add('Dashboard', './my-dashboard-component'),
  TopBar: componentLoader.override('TopBar', './navbar'),
};
export {componentLoader, Component}