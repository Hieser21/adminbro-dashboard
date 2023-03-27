import { Box, Placeholder, H3, Button, Badge } from '@admin-bro/design-system'
import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import { ApiClient, NoticeMessage, useNotice } from 'admin-bro';
import {useCurrentAdmin} from 'admin-bro'
const api = new ApiClient();

const NOTICE_MESSAGE = {
  message: 'I was clicked',
  type: 'success',
};

const Dashboard = () => {
  const [text,  setText] = useState('');
  const [subscription, setSubscription] = useState('');
  const [stat, setStat] = useState('');
  const [logs, setLogs] = useState('')
  const [ping, setPing] = useState('');
  const [user, setUser] = useState('');
  const addNotice = useNotice();
  const handleClick = (event) => {
    event.preventDefault()
  }
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

  const Card = styled(Box)`
  height: 100%;
  `

  return (
    <Box variant="grey">
    <Card variant="white" className="angry-grid">
        <div id="item-0">
        <div className="card">
        <div className="card-details">
          <p className="text-title">Username</p>
          <div className="text-body">{user?.length ? <pre>{user}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}</div>
        </div>
      </div>
      </div>
      <div id="item-1">
      <div className="card">
        <div className="card-details">
          <p className="text-title">Subscription</p>
          <div className="text-body">{subscription?.length ? <pre>{subscription}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}</div>
        </div>
      </div>
      </div>
      <div id="item-2">
      <div className="card">
        <div className="card-details">
          <p className="text-title">Status</p>
          <div className="text-body">{stat == 'Active' ? <pre><Badge variant="success">Active</Badge></pre> : <Badge variant="danger">Offline</Badge>}</div>
        </div>
      </div>
      </div>
          <div id="item-3">
            <div className='card'>
            <div className="card-details">
          <p className="text-title">Announcements</p>
          <div className="text-body">{ping?.length? <pre><p>{ping[0].announcement} at {ping[0].createdAt.split('T')[0]}</p><p>{ping[1].announcement} at {ping[1].createdAt.split('T')[0]}</p><p>{ping[2].announcement} at {ping[2].createdAt.split('T')[0]}</p></pre> : <Badge variant="danger">Nothing</Badge>}</div>
          </div>
          </div>
          </div>
          <div id="item-4">
<div className='card'>
          <div className="card-details">
          <p className="text-title">Anti Exploit</p>
         <p className='text-body'>Placeholder text</p>
          {/* <div className="text-body">{ping?.length? <pre><p>{ping[0].announcement} at {ping[0].createdAt}</p><p>{ping[1].announcement} at {ping[1].createdAt}</p><p>{ping[2].announcement} at {ping[2].createdAt}</p></pre> : <Badge variant="danger">Nothing</Badge>}</div> */}
          </div>
          </div>
          </div>
          <div id="item-5">
            <div className='card'>
          <div className="card-details">
          <p className="text-title">Daily</p>
          <div className="text-body">{logs?.length? <pre><p>{logs[0].description} at {logs[0].createdAt.split('T')[0]}</p><p>{logs[1].description} at {logs[1].createdAt.split('T')[0]}</p><p>{logs[2].description} at {logs[2].createdAt.split('T')[0]}</p></pre> : <Badge variant="danger">Nothing</Badge>}</div>
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
