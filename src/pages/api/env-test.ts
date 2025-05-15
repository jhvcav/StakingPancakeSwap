// src/pages/api/env-test.ts
export default function handler(req, res) {
  res.status(200).json({
    mongodbUri: process.env.MONGODB_URI ? 'Défini (commence par ' + process.env.MONGODB_URI.substring(0, 20) + '...)' : 'Non défini',
    mongodbDb: process.env.MONGODB_DB || 'Non défini',
    nodeEnv: process.env.NODE_ENV || 'Non défini'
  });
}