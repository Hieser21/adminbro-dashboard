import React, { useEffect, useState } from 'react';
import { Box, FormGroup, Input, Button } from '@adminjs/design-system';
import { ApiClient, useNotice } from 'adminjs';
const Settings = () => {
    return (React.createElement(Box, null,
        React.createElement(FormGroup, null,
            React.createElement(Input, { placeholder: "Username" }),
            React.createElement(Button, null, "Save"))));
};
