const { Conversation, Offre, Demande } = require('../models/models');
const geolib = require('geolib');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');


function calculateDistance(userLat, userLon, offerLat, offerLon) {
    const distance = geolib.getDistance(
        { latitude: userLat, longitude: userLon },
        { latitude: offerLat, longitude: offerLon }
    );

    // Convertit la distance en kilomètres et la retourne
    const distanceInKm = distance / 1000;

    // Retourne la distance avec un chiffre après la virgule
    return parseFloat(distanceInKm.toFixed(1));
}

const saveMessage = async (message) => {
    const { from, to, content } = message;

    let conversation = await Conversation.findOne({
        participants: { $all: [new mongoose.Types.ObjectId(from), new mongoose.Types.ObjectId(to)] }
    });

    if (!conversation) {
        conversation = new Conversation({
            participants: [ new mongoose.Types.ObjectId(from), new mongoose.Types.ObjectId(to)],
            messages: [],
        });
    }

    conversation.messages.push({
        content,
        from: new mongoose.Types.ObjectId(from),
        to: new mongoose.Types.ObjectId(to),
    });

    await conversation.save();
};

async function reverseGeocoding(latitude, longitude) {
  try {
    const apiKey = 'AIzaSyCs_KXiaEmUbd50_uSuCKnZ7YDsQ3b9UTY';
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
    const results = response.data.results;
    if (results.length > 0) {
      const addressComponents = results[0].address_components;
      return addressComponents.reduce((acc, current) => {
        acc[current.types[0]] = current.long_name;
        return acc;
      }, {});
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erreur lors du reverse geocoding:", error);
    return null;
  }
}

async function getFilteredOffres(metier, position, token, limit = 4) {
    let query = {};
    let offres = [];
    let excludeUserId = null;
  
    // Vérification et décodage du token
    if (token) {
        try {
          const decoded = jwt.verify(token, process.env.SECRET_KEY);
          excludeUserId = decoded.id;
        } catch (error) {
          console.error('Token Error:', error);
        }
      }
      
  
    // Construire la requête en fonction du métier et de l'exclusion de l'utilisateur
    if (metier) {
      query.metier = metier;
    }
    if (excludeUserId) {
      query['user'] = { $ne: excludeUserId };
    }
  
    // Récupération des offres
    offres = await Offre.find(query)
        .populate('user', 'fullName avatar position addressDetails');
  
    // Calcul de la distance si la position est fournie
    if (position && position.latitude && position.longitude) {
      offres = offres.map(offre => {
        offre._doc.distance = calculateDistance(
          position.latitude,
          position.longitude,
          offre.user.position.latitude,
          offre.user.position.longitude
        );
        return offre;
      });
  
      offres.sort((a, b) => a._doc.distance - b._doc.distance);
    }
  
    // Filtrage des offres
    let offresFiltrees = [];
    let maxOffresParUtilisateur = 1;
    let maxOffresParDomaine = 1;
  
    while (offresFiltrees.length < limit && (maxOffresParUtilisateur <= 10 || maxOffresParDomaine <= 10)) {
      const compteurUtilisateurs = {};
      const compteurDomaines = {};
  
      offresFiltrees = offres.filter(offre => {
        const userId = offre.user._id.toString();
        const domaine = offre.metier;
  
        compteurUtilisateurs[userId] = (compteurUtilisateurs[userId] || 0) + 1;
        compteurDomaines[domaine] = (compteurDomaines[domaine] || 0) + 1;
  
        return compteurUtilisateurs[userId] <= maxOffresParUtilisateur && compteurDomaines[domaine] <= maxOffresParDomaine;
      });
  
      if (offresFiltrees.length < limit) {
        maxOffresParUtilisateur++;
        maxOffresParDomaine++;
      }
    }
  
  
    return offresFiltrees.slice(0, limit);
  }
  
  async function getFilteredDemandes(metier, position,token, limit = 4) {
    let query = {};
    let demandes = [];
    let excludeUserId = null;
  
    // Vérification et décodage du token
    if (token) {
        try {
          const decoded = jwt.verify(token, process.env.SECRET_KEY);
          excludeUserId = decoded.id;
        } catch (error) {
          console.error('Token Error:', error);
        }
      }
      
    // Construire la requête en fonction du métier et de l'exclusion de l'utilisateur
    if (metier) {
      query.metier = metier;
    }
    if (excludeUserId) {
      query['user'] = { $ne: excludeUserId };
    }
  
    // Récupération des demandes
    demandes = await Demande.find(query)
        .populate('user', 'fullName avatar position addressDetails');
  
    // Calcul de la distance si la position est fournie
    if (position && position.latitude && position.longitude) {
      demandes = demandes.map(demande => {
        demande._doc.distance = calculateDistance(
          position.latitude,
          position.longitude,
          demande.user.position.latitude,
          demande.user.position.longitude
        );
        return demande;
      });
  
      demandes.sort((a, b) => a._doc.distance - b._doc.distance);
    }
  
    // Filtrage des demandes
    let demandesFiltrees = [];
    let maxDemandesParUtilisateur = 1;
    let maxDemandesParDomaine = 1;
  
    while (demandesFiltrees.length < limit && (maxDemandesParUtilisateur <= 10 || maxDemandesParDomaine <= 10)) {
      const compteurUtilisateurs = {};
      const compteurDomaines = {};
  
      demandesFiltrees = demandes.filter(demande => {
        const userId = demande.user._id.toString();
        const domaine = demande.metier;
  
        compteurUtilisateurs[userId] = (compteurUtilisateurs[userId] || 0) + 1;
        compteurDomaines[domaine] = (compteurDomaines[domaine] || 0) + 1;
  
        return compteurUtilisateurs[userId] <= maxDemandesParUtilisateur && compteurDomaines[domaine] <= maxDemandesParDomaine;
      });
  
      if (demandesFiltrees.length < limit) {
        maxDemandesParUtilisateur++;
        maxDemandesParDomaine++;
      }
    }
  
    return demandesFiltrees.slice(0, limit);
  }
  





module.exports = { saveMessage, calculateDistance, reverseGeocoding, getFilteredOffres,getFilteredDemandes };
