import React, { useEffect, useState } from 'react';
import { Box, FormGroup, Input, Button } from '@adminjs/design-system';
import { ApiClient, useNotice } from 'adminjs';

const Settings = () => {
  return (
    <Box>
      <FormGroup>
        <Input placeholder="Username" />
        <Button>Save</Button>
      </FormGroup>
    </Box>
  )
}