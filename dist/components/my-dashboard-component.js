import { Box, Placeholder, Badge } from '@adminjs/design-system';
import React, { useEffect, useState } from 'react';
import { styled } from '@adminjs/design-system/styled-components';
import { ApiClient, useCurrentAdmin, useNotice } from 'adminjs';
import { useSwipeable } from 'react-swipeable';
import { toggler } from './navbar';
const api = new ApiClient();
const Dashboard = () => {
    const [currentAdmin, setCurrentAdmin] = useCurrentAdmin();
    const [text, setText] = useState('');
    const [subscription, setSubscription] = useState('');
    const [stat, setStat] = useState('');
    const [logs, setLogs] = useState('');
    const [ping, setPing] = useState('');
    const [user, setUser] = useState('');
    const handlers = useSwipeable({
        onSwipedRight: () => toggler(),
        swipeDuration: 500,
        preventScrollOnSwipe: true,
        trackMouse: false
    });
    const addNotice = useNotice();
    const handleClick = (event) => {
        event.preventDefault();
    };
    useEffect(() => {
        api.getDashboard().then((res) => {
            setText(res.data.text);
            setSubscription(res.data.subscription_type.subscription);
            setStat(res.data.stat.isActive);
            setLogs(res.data.logs);
            setPing(res.data.ping);
            setUser(res.data.user.name);
        });
    });
    const Card = styled(Box) `
  height: 100%;
  `;
    return (React.createElement("div", { ...handlers, style: { backgroundColor: '#1e1e1e' } },
        React.createElement(Box, { color: currentAdmin.theme == 'dark' ? '' : "white", className: 'height', style: currentAdmin.theme == 'dark' ? { backgroundColor: '#281A4F' } : { backgroundColor: 'white' } },
            React.createElement(Card, { color: currentAdmin.theme == 'dark' ? '' : "white", style: currentAdmin.theme == 'dark' ? { marginLeft: '10px', paddingTop: '10px' } : { marginLeft: '10px', paddingTop: '10px' }, className: "angry-grid" },
                React.createElement("div", { id: "item-0" },
                    React.createElement("div", { className: "card", style: currentAdmin.theme == 'dark' ? { background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce' } : { background: '#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce' } },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Username"),
                            React.createElement("div", { className: "text-body" }, user?.length ? React.createElement("pre", null, user) : React.createElement(Placeholder, { style: { width: 100, height: 14 } }))))),
                React.createElement("div", { id: "item-1" },
                    React.createElement("div", { className: "card", style: currentAdmin.theme == 'dark' ? { background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce' } : { background: '#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce' } },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Subscription"),
                            React.createElement("div", { className: "text-body" }, subscription?.length ? React.createElement("pre", null, subscription) : React.createElement(Placeholder, { style: { width: 100, height: 14 } }))))),
                React.createElement("div", { id: "item-2" },
                    React.createElement("div", { className: "card", style: currentAdmin.theme == 'dark' ? { background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce' } : { background: '#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce' } },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Status"),
                            React.createElement("div", { className: "text-body" }, stat == 'Active' ? React.createElement("pre", null,
                                React.createElement(Badge, { variant: "success" }, "Active")) : React.createElement(Badge, { variant: "danger" }, "Offline"))))),
                React.createElement("div", { id: "item-3" },
                    React.createElement("div", { className: 'card', style: currentAdmin.theme == 'dark' ? { background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce' } : { background: '#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce' } },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Announcements"),
                            React.createElement("div", { className: "text-body" }, ping?.length ? React.createElement("pre", null,
                                React.createElement("p", null,
                                    ping[0].announcement,
                                    " at ",
                                    ping[0].createdAt.split('T')[0]),
                                React.createElement("p", null,
                                    ping[1].announcement,
                                    " at ",
                                    ping[1].createdAt.split('T')[0]),
                                React.createElement("p", null,
                                    ping[2].announcement,
                                    " at ",
                                    ping[2].createdAt.split('T')[0])) : React.createElement(Badge, { variant: "danger" }, "No Announcements"))))),
                React.createElement("div", { id: "item-4" },
                    React.createElement("div", { className: 'card', style: currentAdmin.theme == 'dark' ? { background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce' } : { background: '#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce' } },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Anti Exploit"),
                            React.createElement("p", { className: 'text-body' }, "Lorem ipsum sit dolor amet lorem ipsum")))),
                React.createElement("div", { id: "item-5" },
                    React.createElement("div", { className: 'card daily', style: currentAdmin.theme == 'dark' ? { background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce' } : { background: '#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce' } },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Daily"),
                            React.createElement("div", { className: "text-body" }, logs?.length ? React.createElement("pre", null,
                                React.createElement("p", null,
                                    logs[0].description,
                                    " at ",
                                    logs[0].createdAt.split('T')[0]),
                                React.createElement("p", null,
                                    logs[1].description,
                                    " at ",
                                    logs[1].createdAt.split('T')[0]),
                                React.createElement("p", null,
                                    logs[2].description,
                                    " at ",
                                    logs[2].createdAt.split('T')[0])) : React.createElement(Badge, { variant: "danger" }, "No Logs"))))))),
        React.createElement("footer", { className: 'footer-content', style: currentAdmin.theme == 'dark' ? { backgroundColor: '#281A4F', color: 'white' } : { backgroundColor: 'white', color: '#0d1318' } },
            React.createElement("div", null, "Aspect Systems | All rights reserved."))));
};
export default Dashboard;
