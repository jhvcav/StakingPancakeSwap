// Renommez ce fichier en test-mongo.mjs ou gardez test-mongo.js
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '.env.local') });

async function testMongoConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI n\'est pas défini dans .env.local');
    process.exit(1);
  }
  
  console.log(`Tentative de connexion à ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(uri);
    console.log('Connexion réussie!');
    
    // Créer un document de test
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.models.TestDirectConnection || 
                      mongoose.model('TestDirectConnection', TestSchema);
    
    const doc = await TestModel.create({
      message: `Test depuis Node.js à ${new Date().toISOString()}`
    });
    
    console.log('Document créé:', doc);
    
    // Lister les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('Déconnecté.');
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
}

testMongoConnection();