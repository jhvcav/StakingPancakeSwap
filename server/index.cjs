// /workspaces/StakingPancakeSwap/server/index.cjs
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

// Définir le modèle de transaction
const TransactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: String,
  fromToken: String,
  fromAmount: String,
  toToken: String,
  toAmount: String,
  gasUsed: String,
  gasFee: String,
  txHash: { type: String, unique: true },
  status: String,
  notes: String,
  userId: String
});

const Transaction = mongoose.models.Transaction || 
                    mongoose.model('Transaction', TransactionSchema);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionnelle' });
});

// Route pour les transactions
app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Route pour le résumé
app.get('/api/transactions/summary', async (req, res) => {
  try {
    // Calcul des frais par type
    const feesByType = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalFees: { $sum: { $convert: { input: '$gasFee', to: 'double', onError: 0, onNull: 0 } } }
        }
      }
    ]);

    // Initialiser les résultats
    const summaryData = {
      totalConversionFees: 0,
      totalLiquidityFees: 0,
      totalStakingFees: 0,
      totalFees: 0,
      totalValueManaged: '0',
      feesAsPercentage: '0',
      transactionCounts: {}
    };

    // Remplir les données
    feesByType.forEach(({ _id, totalFees }) => {
      if (_id === 'conversion') {
        summaryData.totalConversionFees = totalFees;
      } else if (_id === 'liquidity_add' || _id === 'liquidity_remove') {
        summaryData.totalLiquidityFees += totalFees;
      } else if (_id === 'stake' || _id === 'unstake' || _id === 'harvest') {
        summaryData.totalStakingFees += totalFees;
      }
    });

    // Calculer le total
    summaryData.totalFees = summaryData.totalConversionFees + 
                           summaryData.totalLiquidityFees + 
                           summaryData.totalStakingFees;

    // Formater les nombres
    summaryData.totalConversionFees = summaryData.totalConversionFees.toFixed(6);
    summaryData.totalLiquidityFees = summaryData.totalLiquidityFees.toFixed(6);
    summaryData.totalStakingFees = summaryData.totalStakingFees.toFixed(6);
    summaryData.totalFees = summaryData.totalFees.toFixed(6);

    // Compter les transactions
    const counts = await Transaction.aggregate([
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } }
    ]);

    counts.forEach(({ _id, count }) => {
      summaryData.transactionCounts[`${_id.type}_${_id.status}`] = count;
    });

    res.json({ success: true, data: summaryData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Démarrer le serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
  });
});