require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Offre, Demande } = require('../models/models');

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
     
    router.post("/add", upload.fields([{ name: 'images', maxCount: 3 }]), async (req, res) => {

      try {

        const data = JSON.parse(req.body.data);
         
        console.log("Uploaded Images:", req.files['images']);
        console.log('User id ',data.userId._id)
        if(data.annonceType == 'Offre'){
            const offre = new Offre({
                user: data.userId._id,
                annonceType: data.annonceType,
                metier: data.metier,
                description: data.description,
                disponibilite: data.disponibilite,
                tarif: data.tarif,
                images: req.files['images'] ? req.files['images'].map(file => file.path) : [],
            })

            await offre.save()

            res.json({success: true, fallback: "L'annonce a ete cree avec succes"})
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
            })

            await demande.save()

            res.json({success: true, fallback: "L'annonce a ete cree avec succes"})
        }
      } catch (error) {
        console.error(error);
        return res.json({ success: false, fallback: "An error occurred" });
      }
  
    });

    router.get('/filtregetoffres', async (req, res) => {
      try {
          let offres;
  
          if (req.query.userId) {
              offres = await Offre.find({ user: req.query.userId }).populate('user', 'fullName avatar position');
          } else if (req.query.metier) {
              offres = await Offre.find({ metier: req.query.metier }).populate('user', 'fullName avatar position');
          } else {
              offres = await Offre.find().populate('user', 'fullName avatar position');
          }
  
          return res.json({ success: true, fallback: "Les offres ont ete get avec succes", data: offres });
      } catch (error) {
          console.error(error);
          return res.json({ success: false, fallback: "Failed to get the annonces" });
      }
    });

    router.get('/filtregetdemandes', async (req, res ) => {
    try {
            let demandes;

            if (req.query.userId) {
              demandes = await Demande.find({ user: req.query.userId }).populate('user', 'fullName avatar position');
          } else if (req.query.metier) {
              demandes = await Demande.find({ metier: req.query.metier }).populate('user', 'fullName avatar position');
          } else {
              demandes = await Demande.find().populate('user', 'fullName avatar position');
          }

          return res.json({ success: true, fallback: "Les offres ont ete get avec succes", data: demandes });
      } catch (error) {
          console.error(error);
          return res.json({ success: false, fallback: "Failed to get the annonces" });
      }
    });

      router.get('/annonce/:type/:id', async (req, res) => {
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
