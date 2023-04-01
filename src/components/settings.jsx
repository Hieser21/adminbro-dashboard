import React, { useEffect, useState } from 'react';
import { Box, FormGroup, Input, Button } from '@adminjs/design-system';
import { ApiClient, useNotice } from 'adminjs';

const api = new ApiClient();

const SomeStats = () => {
  const [text, setText] = useState('');
  const [roblox, setRoblox] = useState('');
  const [email, setEmail] = useState('')
  const addNotice = useNotice();
  const handleClick = () => {
 
  }

  const handleRoblox = (event) => {
    setRoblox(event.target.value);
  }

  const handleEmail = (event) => {
    setEmail(event.target.value)
  }

  useEffect(() => {
    api.getPage({ pageName: 'Settings' }).then((res) => {
      setText(res.data.fetch);
    });
  });

  return (
    <Box variant="grey">
      <Box variant="white">
      <FormGroup label="Roblox ID">
          <Input
            name='roblox'
            placeholder='Roblox ID'
            value={roblox}
            onChange={handleRoblox}
          />
          <Input 
          placeholder="Email address"
          name="email"
          value={email}
          onChange={handleEmail}
          />
          <Button onClick={handleClick}>Submit</Button>
        </FormGroup>
      </Box>
    </Box>
  );
};

export default SomeStats;
