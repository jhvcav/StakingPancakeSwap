import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Récupérer l'URI depuis les variables d'environnement
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      return res.status(500).json({ 
        success: false, 
        message: 'MONGODB_URI non défini dans les variables d\'environnement' 
      });
    }
    
    // Fermer toute connexion existante
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }
    
    // Tentative de connexion
    console.log('Tentative de connexion à MongoDB...');
    const startTime = Date.now();
    
    await mongoose.connect(MONGODB_URI);
    
    const connectionTime = Date.now() - startTime;
    console.log(`Connexion réussie en ${connectionTime}ms!`);
    
    // Informations sur la connexion
    const dbName = mongoose.connection.db.databaseName;
    
    // Listez les collections existantes
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Créez un document de test
    const TestModel = mongoose.models.TestConnection || 
      mongoose.model('TestConnection', new mongoose.Schema({
        message: String,
        timestamp: { type: Date, default: Date.now }
      }));
    
    const testDoc = await TestModel.create({
      message: `Test de connexion depuis l'API à ${new Date().toISOString()}`
    });
    
    // Fermez la connexion
    await mongoose.connection.close();
    
    return res.status(200).json({
      success: true,
      connectionTimeMs: connectionTime,
      databaseName: dbName,
      collections: collectionNames,
      testDocument: {
        id: testDoc._id,
        message: testDoc.message,
        timestamp: testDoc.timestamp
      }
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}