// src/pages/api/mongo-test.ts
import connectToDatabase from '../../../lib/mongodb'; // Ajustez le chemin
import Transaction from '../../../models/Transaction'; // Ajustez le chemin

export default async function handler(req, res) {
  try {
    // Tenter de se connecter
    await connectToDatabase();
    
    // Créer un document de test
    const testTx = await Transaction.create({
      type: 'test',
      fromToken: 'TEST',
      fromAmount: '1.0',
      toToken: 'TEST',
      toAmount: '1.0',
      gasUsed: '0',
      gasFee: '0',
      txHash: '0x' + Math.random().toString(36).substring(2),
      status: 'completed'
    });
    
    // Récupérer tous les documents
    const transactions = await Transaction.find({});
    
    res.status(200).json({
      success: true,
      testTransaction: testTx,
      allTransactions: transactions
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      stack: error.stack
    });
  }
}