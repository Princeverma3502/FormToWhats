import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, AppBar, Toolbar, Typography, Box, Paper, Button, Switch, FormControlLabel, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export default function Dashboard(){
  const [members, setMembers] = useState([]);
  const [auto, setAuto] = useState(true);
  const [status, setStatus] = useState('');
  async function loadMembers(){
    try{ const res = await axios.get(`${BACKEND}/api/members`); setMembers(res.data); setStatus('Loaded'); }
    catch(e){ setStatus('Error loading'); }
  }
  useEffect(()=>{ loadMembers(); const id = setInterval(()=>{ if(auto) loadMembers(); }, 15000); return ()=>clearInterval(id); },[auto]);
  async function start(){ try{ await axios.post(`${BACKEND}/api/start`, { spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID || undefined }); setStatus('Started'); }catch(e){ setStatus('Start error'); }}
  return (
    <Container maxWidth='lg' sx={{mt:4}}>
      <AppBar position="static">
        <Toolbar>
          <img src="/logo.svg" alt="logo" style={{width:40, marginRight:12}}/>
          <Typography variant="h6" component="div" sx={{flexGrow:1}}>FormToWhats — Admin</Typography>
          <Button color="inherit" onClick={loadMembers} startIcon={<RefreshIcon/>}>Refresh</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{my:3, display:'flex', gap:2}}>
        <Paper sx={{p:2, flex:1}}><Typography variant="h6">Controls</Typography>
          <Box sx={{mt:2}}>
            <Button variant="contained" onClick={start} sx={{mr:2}}>Start Automation</Button>
            <FormControlLabel control={<Switch checked={auto} onChange={e=>setAuto(e.target.checked)}/>} label="Auto refresh" />
          </Box>
          <Typography sx={{mt:2}}>{status}</Typography>
        </Paper>
        <Paper sx={{p:2, width:420}}>
          <Typography variant="h6">Quick Info</Typography>
          <Typography variant="body2" sx={{mt:1}}>Backend: {BACKEND}</Typography>
          <Typography variant="body2">Invite link: {import.meta.env.VITE_DEFAULT_GROUP_INVITE_LINK || 'not set'}</Typography>
        </Paper>
      </Box>
      <Paper sx={{p:2}}>
        <Typography variant="h6" sx={{mb:2}}>Members</Typography>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell>Joined</TableCell></TableRow></TableHead>
          <TableBody>
            {members.map(m=>(
              <TableRow key={m._id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.phone}</TableCell>
                <TableCell>{m.status}</TableCell>
                <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{mt:4, textAlign:'center'}}>
        <Typography variant="caption">FormToWhats — Professional Dashboard</Typography>
      </Box>
    </Container>
  );
}
