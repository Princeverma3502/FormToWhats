import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import googleRoutes from './routes/googleRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import { initWhatsApp } from './services/whatsapp.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI).then(()=>console.log('MongoDB connected')).catch(err=>console.error(err));
}

app.use('/api/google', googleRoutes);
app.use('/api', apiRoutes);

initWhatsApp().catch(err=>console.error('WhatsApp init error', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
