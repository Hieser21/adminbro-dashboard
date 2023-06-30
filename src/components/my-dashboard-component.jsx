import { Box, Placeholder, Badge } from '@adminjs/design-system'
import React, { useEffect, useState } from 'react'
import {styled} from '@adminjs/design-system/styled-components'
import { ApiClient, useCurrentAdmin, useNotice } from 'adminjs';
import { useSwipeable } from 'react-swipeable'
import { toggler } from './navbar'
const api = new ApiClient();


const Dashboard = () => {
  const [currentAdmin, setCurrentAdmin] = useCurrentAdmin()
  const [text, setText] = useState('');
  const [subscription, setSubscription] = useState('');
  const [stat, setStat] = useState('');
  const [logs, setLogs] = useState('')
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
  let today = new Date();
  let dd = today.getDate();
  
  let mm = today.getMonth()+1; 
  const yyyy = today.getFullYear();
  if(dd<10) 
  {
      dd=`0${dd}`;
  } 
  
  if(mm<10) 
  {
      mm=`0${mm}`;
  } 
  today = `${yyyy}-${mm}-${dd}`
  return (
    <div {...handlers} style={{backgroundColor: '#1e1e1e'}}>
      <Box color={currentAdmin.theme == 'dark' ? '':"white"} className='height' style={currentAdmin.theme == 'dark' ? {backgroundColor:'#281A4F'}: {backgroundColor: 'white'}}>
        <Card color={currentAdmin.theme == 'dark' ? '':"white"} style={currentAdmin.theme == 'dark' ? {marginLeft: '10px', paddingTop: '10px'}:{marginLeft: '10px', paddingTop: '10px'}} className="angry-grid">
          <div id="item-0">
            <div className="card" style={currentAdmin.theme == 'dark' ? {color: 'white', } : {color: '#0d1318'}}>
              <div className="card-details">
                <p className="text-title">Username</p>
                <hr style={{width: '100%'}}/>
                <div className="text-body">{user?.length ? <pre>{user}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}</div>
              </div>
            </div>
          </div>
          <div id="item-1">
            <div className="card" style={currentAdmin.theme == 'dark' ? {color: 'white', } : { color: '#0d1318'}}>
              <div className="card-details">
                <p className="text-title">Subscription</p>
                <hr style={{width: '100%'}}/>
                <div className="text-body">{subscription?.length ? <pre>{subscription}</pre> : <Placeholder style={{ width: 100, height: 14 }} />}</div>
              </div>
            </div>
          </div>
          <div id="item-2">
            <div className="card" style={currentAdmin.theme == 'dark' ? {color: 'white', } : { color: '#0d1318'}}>
              <div className="card-details">
                <p className="text-title">Status</p>
                <hr style={{width: '100%'}}/>
                <div className="text-body">{stat == 'Active' ? <pre><Badge variant="success">Active</Badge></pre> : <Badge variant="danger">Offline</Badge>}</div>
              </div>
            </div>
          </div>
          <div id="item-3">
            <div className='card daily' style={currentAdmin.theme == 'dark' ? {background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce'} : {background:'#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce'}}>
              <div className="card-details">
                <p className="text-title">Announcements</p>
                <div className="text-body">{ping?.length ? <pre><p>{ping[0].announcement} at {ping[0].createdAt.split('T')[0]}</p><p>{ping[1].announcement} at {ping[1].createdAt.split('T')[0]}</p><p>{ping[2].announcement} at {ping[2].createdAt.split('T')[0]}</p></pre> : <Badge variant="danger">No Announcements</Badge>}</div>
              </div>
            </div>
          </div>
          <div id="item-5">
            <div className='card daily' style={currentAdmin.theme == 'dark' ? {background: '#1e1e1e', color: 'white', border: '0px solid #c3c6ce'} : {background:'#f7f7f7', color: '#0d1318', border: '2px solid #c3c6ce'}}>
              <p className="text-title" style={{textAlign: 'center'}}>Daily</p>
              <div className="card-details" style={{placeContent: 'normal', paddingTop: '10px'}}>
                <div className="text-body">{logs[0]?.createdAt.split('T')[0] == today ? <pre><p>{logs[0]?.createdAt.split('T')[0] == today ? logs[0]?.description : ''} at {logs[0]?.createdAt.split('T')[0] == today ? logs[0]?.createdAt.split('T')[0]: ''}</p><p>{logs[1]?.createdAt.split('T')[0] == today ? logs[1]?.description : ''} at {logs[1]?.createdAt.split('T')[0] == today ? logs[1]?.createdAt.split('T')[0] : ''}</p><p>{logs[2]?.createdAt.split('T')[0] == today ?logs[2]?.description : ''} at {logs[2]?.createdAt.split('T')[0] == today ? logs[2]?.createdAt.split('T')[0] : ''}</p></pre> : <Badge variant="danger">No Logs</Badge>}</div>
              </div>
            </div>
          </div>
        </Card>


      </Box>
      <footer className='footer-content' style={currentAdmin.theme == 'dark' ? {backgroundColor: '#281A4F', color: 'white'}: { backgroundColor: 'white', color: '#0d1318'}}>
        <div>Aspect Systems | All rights reserved.</div></footer>
    </div>
  )
}
export default Dashboard
