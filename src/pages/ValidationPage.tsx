import React from 'react';
import { ValidationChecker } from '../components/ValidationChecker';

export function ValidationPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4">
        <ValidationChecker />
      </div>
    </main>
  );
}