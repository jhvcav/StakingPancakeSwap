import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsChartProps {
  data: any;
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (!data) return null;

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="tvl" stroke="#8884d8" name="TVL" />
          <Line type="monotone" dataKey="users" stroke="#82ca9d" name="Utilisateurs" />
          <Line type="monotone" dataKey="pools" stroke="#ffc658" name="Pools" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}