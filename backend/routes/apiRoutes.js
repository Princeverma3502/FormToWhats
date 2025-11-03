import express from 'express';
import { startPollingSheet } from '../services/googleSheets.js';
import Member from '../models/Member.js';
const router = express.Router();

router.post('/start', async (req,res)=>{
  try{
    const { spreadsheetId, range } = req.body;
    await startPollingSheet(spreadsheetId || process.env.GOOGLE_SHEET_ID, range || 'Form Responses!A2:C');
    return res.json({ ok:true });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

router.get('/members', async (req,res)=>{
  const docs = await Member.find().sort({createdAt:-1}).limit(200);
  res.json(docs);
});

export default router;
