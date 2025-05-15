// lib/mongodb.ts
import mongoose from 'mongoose';

export default async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI non défini dans les variables d\'environnement');
    }
    
    // Si déjà connecté, réutiliser la connexion
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    
    // Connexion à MongoDB// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'staking-db';

if (!MONGODB_URI) {
  throw new Error('Veuillez définir la variable d\'environnement MONGODB_URI');
}

/**
 * Connexion à MongoDB avec gestion détaillée des erreurs
 */
export default async function connectToDatabase() {
  // Si déjà connecté, réutiliser la connexion
  if (mongoose.connection.readyState >= 1) {
    console.log('Réutilisation de la connexion MongoDB existante');
    return mongoose.connection;
  }

  console.log('Tentative de connexion à MongoDB...');
  console.log(`URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Masquer les identifiants
  
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
    });
    
    console.log(`Connexion à MongoDB réussie! Base de données: ${conn.connection.db.databaseName}`);
    
    // Configurer des listeners pour les événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('Erreur MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Déconnecté de MongoDB');
    });
    
    return conn.connection;
  } catch (error) {
    console.error('Échec de la connexion à MongoDB:', error);
    
    // Fournir des informations supplémentaires sur l'erreur
    if (error.name === 'MongoServerSelectionError') {
      console.error('Impossible de se connecter au serveur MongoDB. Vérifiez:');
      console.error('1. Que votre adresse IP est autorisée dans MongoDB Atlas');
      console.error('2. Que vos identifiants sont corrects');
      console.error('3. Que le serveur MongoDB est accessible');
    }
    
    throw error;
  }
}
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB');
    
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    throw error;
  }
}