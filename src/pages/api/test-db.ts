// src/pages/api/test-db.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import connectToDatabase from '../../../lib/mongodb'; // Remonter de src/pages/api à la racine

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Vérifier si la variable d'environnement est définie
    if (!process.env.MONGODB_URI) {
      throw new Error('La variable d\'environnement MONGODB_URI n\'est pas définie');
    }
    
    console.log('Tentative de connexion à MongoDB...');
    
    // Se connecter à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion à MongoDB réussie!');
    
    // Créer un schéma et un modèle de test
    const TestSchema = new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    });
    
    // Utiliser un modèle existant ou en créer un nouveau
    const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    // Insérer un document de test
    await Test.create({ name: 'Test connection ' + new Date().toISOString() });
    console.log('Document de test créé avec succès');
    
    // Récupérer tous les documents de test
    const testDocs = await Test.find({});
    
    res.status(200).json({ 
      success: true, 
      message: 'Connexion à MongoDB réussie et document inséré!',
      count: testDocs.length,
      documents: testDocs 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      mongodbUri: process.env.MONGODB_URI ? 'Défini' : 'Non défini' 
    });
  } finally {
    // Fermer la connexion
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      console.log('Déconnexion de MongoDB');
    }
  }
}