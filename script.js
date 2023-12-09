require('dotenv').config();

const jwt = require('jsonwebtoken');

function generateToken(userId) {
  // Assurez-vous que SECRET_KEY est définie dans vos variables d'environnement.
  if (!process.env.SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined in the environment variables');
  }

  const token = jwt.sign({ id: userId }, process.env.SECRET_KEY, { expiresIn: '30d' });
  return token;
}

// Utilisation de la fonction
try {
  const myToken = generateToken('64f729d2e9f03fa58bdfb330');
  console.log(myToken);
} catch (error) {
  console.error(error);
}
