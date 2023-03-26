import { Box, Placeholder, H3, Button, Badge } from '@admin-bro/design-system'
import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import { ApiClient, NoticeMessage, useNotice } from 'admin-bro';
const api = new ApiClient();

const NOTICE_MESSAGE = {
  message: 'I was clicked',
  type: 'success',
};

const Dashboard = () => {
  const [text,  setText] = useState('');
  const [subscription, setSubscription] = useState('');
  const [stat, setStat] = useState('');
  const addNotice = useNotice();
  const handleClick = (event) => {
    event.preventDefault()
  }
  
  useEffect(() => {
    api.getDashboard().then((res) => {
      setText(res.data.text);
      setSubscription(res.data.subscription);
      setStat(res.data.stat);
    });
  });

  const Card = styled(Box)`
  height: 100%;
  `

  return (
    <Box variant="grey">
    <Card variant="white">
      <div className="row">
        <div className='column'>
        <div className="card">
        <div className="card-details">
          <p className="text-title">Username</p>
          <div className="text-body">{text?.length ? <pre>{text}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}</div>
        </div>
      </div>
      </div>
      <div className="column">
      <div className="card">
        <div className="card-details">
          <p className="text-title">Subscription</p>
          <div className="text-body">{subscription?.length ? <pre>{subscription}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}</div>
        </div>
      </div>
      </div>
      <div className="column">
      <div className="card">
        <div className="card-details">
          <p className="text-title">Status</p>
          <div className="text-body">{stat == 'active' ? <pre><Badge variant="success">Active</Badge></pre> : <Badge variant="danger">Offline</Badge>}</div>
        </div>
      </div>
      </div>
      </div>
    </Card>
    <Box variant='card'>
    <footer>
      <div className="”footer-content”">
        <h3>Aspect Systems | All right reserved.</h3>
      </div>
      </footer>
      </Box>
  </Box>
  )
}
export default Dashboard
