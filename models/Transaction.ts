// models/Transaction.ts
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: String,
  fromToken: String,
  fromAmount: String,
  toToken: String,
  toAmount: String,
  gasUsed: String,
  gasFee: String,
  txHash: String,
  status: String,
  notes: String
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);