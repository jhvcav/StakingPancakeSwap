import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'staking-db'; // CORRIGÉ: utiliser la bonne base de données

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('transactions');
    
    if (req.method === 'POST') {
      // Validation des données
      const requiredFields = ['type', 'fromToken', 'toToken', 'txHash'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            error: `Le champ ${field} est requis`
          });
        }
      }

      // Créer une nouvelle transaction
      const transaction = {
        ...req.body,
        date: new Date(req.body.date || Date.now()),
        createdAt: new Date(),
        gasFee: req.body.gasFee || '0',
        status: req.body.status || 'completed'
      };
      
      const result = await collection.insertOne(transaction);

      console.log('Transaction enregistrée dans MongoDB:', transaction);
      
      return res.status(201).json({
        success: true,
        data: { ...transaction, _id: result.insertedId }
      });
    } else if (req.method === 'GET') {
      // Récupérer les transactions avec filtres optionnels
      const { limit = 50, page = 1, type, status, fromDate, toDate } = req.query;
      
      const query: any = {};
      
      if (type) query.type = type;
      if (status) query.status = status;
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate as string);
        if (toDate) query.date.$lte = new Date(toDate as string);
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const transactions = await collection
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray();
        
      const total = await collection.countDocuments(query);
      
      return res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      });
    }
    
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
}