// src/pages/api/simple-test.ts
export default function handler(req, res) {
  res.status(200).json({ message: 'API fonctionne!' });
}