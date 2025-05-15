import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Vérifier que MONGODB_URI est défini
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return res.status(500).json({ 
        success: false, 
        error: 'MONGODB_URI n\'est pas défini dans les variables d\'environnement'
      });
    }

    // Si déjà connecté, fermer la connexion pour ce test
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }

    // Se connecter à MongoDB
    console.log('Tentative de connexion à MongoDB depuis l\'API Next.js...');
    await mongoose.connect(uri);
    console.log('Connexion réussie!');

    // Créer un simple schéma et modèle pour le test
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });

    // Utiliser un modèle existant ou créer un nouveau
    const TestModel = mongoose.models.NextjsTest || 
                    mongoose.model('NextjsTest', TestSchema);

    // Créer un document de test
    const testDoc = await TestModel.create({
      message: `Test depuis Next.js API à ${new Date().toISOString()}`
    });

    // Lister les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Fermer la connexion pour ce test
    await mongoose.connection.close();
    console.log('Déconnecté de MongoDB');

    // Renvoyer les résultats
    return res.status(200).json({
      success: true,
      message: 'Connexion à MongoDB réussie depuis Next.js API',
      documentCreated: testDoc,
      collections: collectionNames,
      mongodbUri: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 
        'Non défini'
    });
  } catch (error) {
    console.error('Erreur de connexion MongoDB depuis Next.js API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}