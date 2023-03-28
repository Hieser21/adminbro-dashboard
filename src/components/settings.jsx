import React, { useEffect, useState } from 'react';
import { Box} from '@adminjs/design-system';
import { ApiClient, NoticeMessage, useNotice } from 'adminjs';

const api = new ApiClient();

const NOTICE_MESSAGE = {
  message: 'I was clicked',
  type: 'success',
};

const SomeStats = () => {
  const [text, setText] = useState('');
  const addNotice = useNotice();

    


  useEffect(() => {
    api.getPage({ pageName: 'Settings' }).then((res) => {
      setText(res.data.fetch);
    });
  });

  return (
    <Box variant="grey">
      <Box variant="white">
        
      </Box>
    </Box>
  );
};

export default SomeStats;
