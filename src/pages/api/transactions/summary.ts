// pages/api/transactions/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import Transaction from '../../../models/Transaction'; 
import mongoose from 'mongoose';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    // Aggrégation pour calculer les totaux par type
    const feesByType = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalFees: { $sum: { $toDouble: '$gasFee' } }
        }
      }
    ]);

    // Création d'un objet pour les résultats
    const summaryData = {
      totalConversionFees: 0,
      totalLiquidityFees: 0,
      totalStakingFees: 0,
      totalFees: 0,
      totalValueManaged: '1,000,000', // À remplacer par un calcul réel
      feesAsPercentage: '0',
      transactionCounts: {}
    };

    // Parcours des résultats pour remplir l'objet
    feesByType.forEach(({ _id, totalFees }) => {
      if (_id === 'conversion') {
        summaryData.totalConversionFees = totalFees;
      } else if (_id === 'liquidity_add' || _id === 'liquidity_remove') {
        summaryData.totalLiquidityFees += totalFees;
      } else if (_id === 'stake' || _id === 'unstake' || _id === 'harvest') {
        summaryData.totalStakingFees += totalFees;
      }
    });

    // Calcul du total des frais
    summaryData.totalFees = summaryData.totalConversionFees + 
                           summaryData.totalLiquidityFees + 
                           summaryData.totalStakingFees;

    // Calcul du pourcentage
    const totalValue = parseFloat(summaryData.totalValueManaged.replace(/,/g, ''));
    summaryData.feesAsPercentage = (summaryData.totalFees / totalValue * 100).toFixed(4);

    // Compter les transactions par type et statut
    const transactionCounts = await Transaction.aggregate([
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Formatage des résultats
    transactionCounts.forEach(({ _id, count }) => {
      const key = `${_id.type}_${_id.status}`;
      summaryData.transactionCounts[key] = count;
    });

    // Formatage des valeurs numériques
    summaryData.totalConversionFees = summaryData.totalConversionFees.toFixed(6);
    summaryData.totalLiquidityFees = summaryData.totalLiquidityFees.toFixed(6);
    summaryData.totalStakingFees = summaryData.totalStakingFees.toFixed(6);
    summaryData.totalFees = summaryData.totalFees.toFixed(6);

    return res.status(200).json({
      success: true,
      data: summaryData
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}