require('dotenv').config();
const express = require('express');
const router = express.Router();
const { Offre, Demande,User } = require('../models/models');
const RequestLimitor = require('../middleware/requestLimitor')

// Route pour obtenir toutes les offres
router.get('/allOffres', async (req, res) => {
  try {
    const offres = await Offre.find()
      .populate('user', '-_id fullName addressDetails')
      .select('_id annonceType metier description disponibilite tarif')
      .exec();

    res.json({
      success: true,
      data: offres
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des offres"
    });
  }
});

router.get('/allDemandes', async (req, res) => {
  try {
    const offres = await Demande.find()
      .select('_id')
      .exec();

    res.json({
      success: true,
      data: offres
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des offres"
    });
  }
});

router.get('/allProfiles', async (req, res) => {
  try {
    const offres = await User.find()
      .select('_id')
      .exec();

    res.json({
      success: true,
      data: offres
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des offres:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des offres"
    });
  }
});

router.get('/annonce/:type/:id' ,RequestLimitor, async (req, res) => {
  const id = req.params.id;
  const annonceType = req.params.type;

  console.log("id " + id);
  console.log("annonceType " + annonceType);

  try {
      if (annonceType === 'offre') {
          const annonce = await Offre.findById(id).populate('user', 'fullName avatar position age bio');
          
          if (!annonce) {
              return res.status(404).json({ error: 'Annonce not found' });
          }
          res.json(annonce);
      }
      if (annonceType === 'demande') {
          const annonce = await Demande.findById(id).populate('user', 'fullName avatar position age bio');
          
          if (!annonce) {
              return res.status(404).json({ error: 'Annonce not found' });
          }
          res.json(annonce);
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/maxPageOffres' , async (req, res) => {
  const totalOffersCount = await Offre.countDocuments();
  const maxPage = Math.ceil(totalOffersCount / 4);
  res.json(maxPage);

});

;




module.exports = router;
