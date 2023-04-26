import { Box, Button, DropDown, DropDownItem, DropDownMenu, DropDownTrigger, Icon, } from '@adminjs/design-system';
import { useCurrentAdmin, useTranslation } from 'adminjs';
import React from 'react';
import { useSelector } from 'react-redux';
import { overrides } from '../themes/my-custom-theme/overrides.js';
export const themeConfig = {
    id: 'my-custom-theme',
    name: 'My custom theme',
    overrides,
};
const ThemeSelector = () => {
    const [currentAdmin, setCurrentAdmin] = useCurrentAdmin();
    const availableThemes = useSelector((state) => state.theme.availableThemes);
    const currentTheme = useSelector((state) => state.theme);
    const { translateComponent } = useTranslation();
    const changeTheme = (theme) => {
        const themeName = () => {
            if (theme.name == 'AdminJS Dark theme') {
                return 'dark';
            }
            else {
                return theme.name;
            }
        };
        currentAdmin.theme = theme.id;
    };
    return (React.createElement(Box, { flex: true, flexGrow: 1, alignItems: "center", ml: "lg" },
        React.createElement(DropDown, null,
            React.createElement(DropDownTrigger, null,
                React.createElement(Button, { color: "black" },
                    React.createElement(Icon, { icon: "Layers" }),
                    translateComponent(`ThemeSelector.availableThemes.${currentTheme}`, { defaultValue: currentTheme.id }))),
            React.createElement(DropDownMenu, null, availableThemes.map(theme => (React.createElement(DropDownItem, { key: theme.id, onClick: () => {
                    currentAdmin.theme = theme.id;
                } }, translateComponent(`ThemeSelector.availableThemes.${theme}`, {
                defaultValue: theme.id,
            }))))))));
};
export default ThemeSelector;
