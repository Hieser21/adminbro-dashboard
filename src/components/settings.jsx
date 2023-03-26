import React, { useEffect, useState } from 'react';
import { Box, H3, Placeholder, Button, TextArea, FormGroup } from '@admin-bro/design-system';
import { ApiClient, NoticeMessage, useNotice } from 'admin-bro';

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
        <form onSubmit={function(e){e.preventDefault; api.getPage({pageName:'Settings'}).then((res) => {
            setText(res.data.text)
        })}}>
          <input name='name' type={'text'}></input>
          <button type='submit'>Submit</button>
          {fetch?.length ? <pre>{fetch}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}
        </form>
        
      </Box>
    </Box>
  );
};

export default SomeStats;
