import { Box, Placeholder, Badge } from '@adminjs/design-system';
import React, { useEffect, useState } from 'react';
import { styled } from '@adminjs/design-system/styled-components';
import { ApiClient, useNotice } from 'adminjs';
import { useSwipeable } from 'react-swipeable';
import { toggler } from './navbar';
const api = new ApiClient();
const Dashboard = () => {
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
    return (React.createElement("div", { ...handlers },
        React.createElement(Box, { color: "white", className: 'height' },
            React.createElement(Card, { variant: "white", className: "angry-grid" },
                React.createElement("div", { id: "item-0" },
                    React.createElement("div", { className: "card" },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Username"),
                            React.createElement("div", { className: "text-body" }, user?.length ? React.createElement("pre", null, user) : React.createElement(Placeholder, { style: { width: 100, height: 14 } }))))),
                React.createElement("div", { id: "item-1" },
                    React.createElement("div", { className: "card" },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Subscription"),
                            React.createElement("div", { className: "text-body" }, subscription?.length ? React.createElement("pre", null, subscription) : React.createElement(Placeholder, { style: { width: 100, height: 14 } }))))),
                React.createElement("div", { id: "item-2" },
                    React.createElement("div", { className: "card" },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Status"),
                            React.createElement("div", { className: "text-body" }, stat == 'Active' ? React.createElement("pre", null,
                                React.createElement(Badge, { variant: "success" }, "Active")) : React.createElement(Badge, { variant: "danger" }, "Offline"))))),
                React.createElement("div", { id: "item-3" },
                    React.createElement("div", { className: 'card' },
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
                                    ping[2].createdAt.split('T')[0])) : React.createElement(Badge, { variant: "danger" }, "No announcements"))))),
                React.createElement("div", { id: "item-4" },
                    React.createElement("div", { className: 'card' },
                        React.createElement("div", { className: "card-details" },
                            React.createElement("p", { className: "text-title" }, "Anti Exploit"),
                            React.createElement("p", { className: 'text-body' }, "Lorem ipsum sit dolor amet lorem ipsum")))),
                React.createElement("div", { id: "item-5" },
                    React.createElement("div", { className: 'card daily' },
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
                                    logs[2].createdAt.split('T')[0])) : React.createElement(Badge, { variant: "danger" }, "No logs"))))))),
        React.createElement("footer", { className: 'footer-content' },
            React.createElement("div", null, "Aspect Systems | All rights reserved."))));
};
export default Dashboard;
