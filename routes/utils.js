require('dotenv').config();
const express = require('express');
const router = express.Router();
const {adminToken} = require('../middleware/Admin')
const verifyToken = require("../middleware/verifyToken")
const RequestLimitor = require('../middleware/requestLimitor')
const myVerifyToken = require("../middleware/myVerifyToken")
const { User, Offre, Demande, } = require('../models/models');
const { EmergencyFeature } = require('../models/featuresModel');
const Activity = require('../models/statModel')

router.post('/record-phone-number', async (req, res) => {
  try {
    const { requesterId, providerId, isGuest } = req.body;
    const activity = new Activity({
      requester: isGuest ? null : requesterId,
      provider: providerId,
      isGuest: isGuest
    });

    await activity.save();
    res.status(201).json({ success: true, message: 'Activité enregistrée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l’enregistrement de l’activité:', error);
    res.status(500).json({ success: false, message: 'Échec de l’enregistrement de l’activité.' });
  }
});

// Peut etre dans le programme du'urgence

router.get('/can-join-emergency/:id', RequestLimitor, async (req, res) => {
  const { id } = req.params;
  
  try {
    const alreadyInEmergencyQueue = await EmergencyFeature.findOne({ user: id });
    if (alreadyInEmergencyQueue) {
      return res.json({ success: true, canJoinEmergency: false, message: 'Vous êtes déjà dans la file d’attente.' });
    } 

    const userOffers = await Offre.countDocuments({ user: id });
    if (userOffers > 0) {
      return res.json({ success: true, canJoinEmergency: true });
    } else {
      return res.json({ success: true, canJoinEmergency: false, message: 'Vous devez créer une offre pour rejoindre la file d’attente.' });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la possibilité de rejoindre le programme d'urgence:", error);
    res.status(500).json({ success: false, message: "Échec de la vérification" });
  }
});

router.post('/join-emergency', RequestLimitor, async (req, res) => {
  const { id } = req.body; // Assurez-vous que l'ID de l'utilisateur est envoyé dans le corps de la requête
  
  try {
    const newEmergencyFeature = new EmergencyFeature({
      user: id,
      status: 'attente',
      createdDate: new Date(),
    });
    await newEmergencyFeature.save();
    res.json({ success: true, message: 'Vous avez été ajouté à la file d’attente d’urgence.' });
  } catch (error) {
    console.error("Erreur lors de l'ajout à la file d'urgence:", error);
    res.status(500).json({ success: false, message: "Échec de l'ajout à la file d'urgence" });
  }
});

  

module.exports = router;
