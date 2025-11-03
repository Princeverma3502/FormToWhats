import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const Member = new Schema({
  name: String,
  phone: String,
  status: { type: String, default: 'pending' },
  raw: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Member', Member);
