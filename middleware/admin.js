require('dotenv').config();
const { User } = require ('../models/models');
const jwt = require('jsonwebtoken');

function adminToken(req, res, next) {
    // Récupérer le token du header 'Authorization'
    const bearerHeader = req.headers['authorization'];

    
  
    if (typeof bearerHeader !== 'undefined') {
      const bearerToken = bearerHeader.split(' ')[1];
      
      jwt.verify(bearerToken, process.env.SECRET_KEY_ADMIN, (err, authData) => {
        if (err) {
          return res.status(403).json({ success: false, fallback: "Token invalide" });
        }
        


      next();
    });
  } else {
    res.status(403).json({ success: false, fallback: "Token manquant" });
  }
}

// Ce middleware doit être défini avant son utilisation dans les routes.
function checkBan(req, res, next) {
  // L'utilisateur doit être attaché à req.user par un précédent middleware d'authentification
  const user = req.user;

  // Vérifier si l'utilisateur est banni et si la période de bannissement n'est pas terminée
  if (user.isBanned && user.isBanned.status) {
      const now = new Date();
      if (now < user.isBanned.details.banEnd) {
          const banTimeLeft = (user.isBanned.details.banEnd - now) / 3600000; // Temps restant en heures
          return res.status(403).json({
              message: `Vous êtes banni pour encore ${banTimeLeft.toFixed(2)} heures. Raison: ${user.isBanned.details.banReason}`
          });
      }
  }

  // Si l'utilisateur n'est pas banni ou que le bannissement est terminé, passer au middleware suivant
  next();
}

  
module.exports = {adminToken, checkBan};
