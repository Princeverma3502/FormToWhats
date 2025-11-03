import express from 'express';
import { oauthUrl, oauthCallback } from '../services/googleSheets.js';
const router = express.Router();
router.get('/auth/url', (req,res)=>{
  try{ res.json({ url: oauthUrl() }); }catch(e){ res.status(500).json({error:e.message}); }
});
router.get('/oauth2callback', async (req,res)=>{
  try{ const code = req.query.code; await oauthCallback(code); res.send('Google authorized. You can close this window.'); }
  catch(e){ res.status(500).send('OAuth error: '+e.message); }
});
export default router;
