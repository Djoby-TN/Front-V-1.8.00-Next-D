require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const myVerifyToken = require("../middleware/myVerifyToken")
const verifyToken = require("../middleware/verifyToken")
const RequestLimitor = require('../middleware/requestLimitor')
const jwt = require('jsonwebtoken');
const { calculateDistance, getFilteredOffres, getFilteredDemandes } = require('../utils/utils'); 
const { Offre, Demande ,} = require('../models/models');

module.exports = (db) => {  
  
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
           cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
           cb(null, Date.now() + '-' + file.originalname);
        }
      });
    
      const upload = multer({
          storage: storage
      });
     
      router.post("/add",  upload.fields([{ name: 'images', maxCount: 3 }]), async (req, res) => {
        try {
            const data = JSON.parse(req.body.data);
             

            if(data.annonceType == 'Offre'){
                const offre = new Offre({
                    user: data.userId._id,
                    annonceType: data.annonceType,
                    metier: data.metier,
                    description: data.description,
                    disponibilite: data.disponibilite,
                    tarif: data.tarif,
                    images: req.files['images'] ? req.files['images'].map(file => file.path) : [],
                });
    
                await offre.save();

                const matchedDemandes = await Demande.find({ metier: data.metier });
                const matchingDemandeIds = matchedDemandes.map(demande => demande._id);
    

                res.json({success: true, fallback: "L'annonce a ete cree avec succes"});
            }
    
            if(data.annonceType == 'Demande'){
                const demande = new Demande({
                    user: data.userId._id,
                    annonceType: data.annonceType,
                    metier: data.metier,
                    description: data.description,
                    disponibilite: data.disponibilite,
                    tarif: data.tarif,
                    images: req.files['images'] ? req.files['images'].map(file => file.path) : [],
                });
    
                await demande.save();
    
           
    
                res.json({success: true, fallback: "L'annonce a ete cree avec succes"});
            }
        } catch (error) {
            console.error(error);
            return res.json({ success: false, fallback: "An error occurred" });
        }
    });
    

    // Get les offres et demandes

    router.get('/getoffres', async (req, res) => {
        try {
          let token = req.cookies.guestToken || req.headers['authorization'];
          let bearerToken; // Déclaration de la variable au début du bloc try pour une portée plus large
      
          if (token) {
            // Extraire le token sans le mot clé 'Bearer'
            bearerToken = token.split(' ')[1]; // Utilisation de let retirée pour déclarer la variable au début du bloc
      
            try {
              jwt.verify(bearerToken, process.env.SECRET_KEY);
            } catch (err) {
              console.error('Erreur de vérification du token:', err);
              token = null; // Si le token est incorrect, le mettre à null
            }
          }
      
          const { metier, latitude, longitude } = req.query;
          const position = latitude && longitude ? { latitude, longitude } : null;
      
          // Assurez-vous que bearerToken est transmis à la fonction getFilteredOffres
          const offres = await getFilteredOffres(metier, position, bearerToken);
      
          return res.json({ success: true, fallback: "Les offres ont été récupérées avec succès", data: offres });
        } catch (error) {
          console.error(error);
          return res.json({ success: false, fallback: "Échec de la récupération des annonces" });
        }
      });
      
    
      

    router.get('/getdemandes', RequestLimitor , async (req, res ) => {
    try {
      let token = req.cookies.guestToken || req.headers['authorization'];
      let bearerToken; // Déclaration de la variable au début du bloc try pour une portée plus large
  
      if (token) {
        // Extraire le token sans le mot clé 'Bearer'
        bearerToken = token.split(' ')[1]; // Utilisation de let retirée pour déclarer la variable au début du bloc
  
        try {
          jwt.verify(bearerToken, process.env.SECRET_KEY);
        } catch (err) {
          console.error('Erreur de vérification du token:', err);
          token = null; // Si le token est incorrect, le mettre à null
        }
      }

      const { metier, latitude, longitude } = req.query;
      const position = latitude && longitude ? { latitude, longitude } : null;
  
      // Assurez-vous que bearerToken est transmis à la fonction getFilteredOffres
      const demandes = await getFilteredDemandes(metier, position, bearerToken);
  
      return res.json({ success: true, fallback: "Les demandes ont été récupérées avec succès", data: demandes });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, fallback: "Échec de la récupération des demandes" });
    }
  });



  // get mes offres et demandes
        

  router.get('/mesoffres', myVerifyToken, async (req, res) => {
    try {

        let offres;
        const { userId} = req.query;

        if (userId) {
            offres = await Offre.find({ user: req.query.userId }).populate('user', 'fullName avatar position addressDetails ');
          }

        return res.json({ success: true, fallback: "Vos offres ont été récupérées avec succès", data: offres });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, fallback: "Failed to get vos annonces" });
    }
  });


    router.get('/mesdemandes', RequestLimitor , async (req, res ) => {
        try {
                let demandes;

                const { userId} = req.query;

    
                if (userId) {
                  demandes = await Demande.find({ user: req.query.userId }).populate('user', 'fullName avatar position addressDetails ');
              } 
    
             
    
              return res.json({ success: true, fallback: "Vos demandes ont ete get avec succes", data: demandes });
          } catch (error) {
              console.error(error);
              return res.json({ success: false, fallback: "Failed vos demandes" });
          }
        });



      router.get('/annonce/:type/:id', RequestLimitor, verifyToken , async (req, res) => {
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
  
    

    return router;
  };