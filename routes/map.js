require("dotenv").config();
const express = require("express");
const router = express.Router();
const multer = require("multer");
const myVerifyToken = require("../middleware/myVerifyToken");
const verifyToken = require("../middleware/verifyToken");
const RequestLimitor = require("../middleware/requestLimitor");
const jwt = require("jsonwebtoken");
const { calculateDistance, getFilteredOffres } = require("../utils/utils");
const { Offre, Demande } = require("../models/models");

router.get("/getoffresmap", async (req, res) => {
    try {
        const metier = req.query.metier;
        let query = {};

        if (metier) {
            query.metier = metier;
        }

        let offres = await Offre.find(query)
            .populate("user", "fullName avatar position addressDetails");
    
        const offresGroupées = {};
        const offresIndividuelles = [];
    
        offres.forEach(offre => {
            const clé = `${offre.user.position.latitude}_${offre.user.position.longitude}`;
            const offreData = {
                _id: offre._id,
                user: offre.user,
                metier: offre.metier,
                tarif: offre.tarif,
                annonceType: offre.annonceType,
                // autres champs de l'offre que vous souhaitez inclure...
            };
    
            if (offresGroupées[clé]) {
                offresGroupées[clé].offres.push(offreData);
            } else {
                offresGroupées[clé] = {
                    user: offre.user,
                    offres: [offreData]
                };
            }
        });
    
        // Ajouter le total d'offres et séparer les offres individuelles et groupées
        for (const key in offresGroupées) {
            const groupe = offresGroupées[key];
            groupe.totalOffres = groupe.offres.length;
    
            if (groupe.offres.length === 1) {
                offresIndividuelles.push(groupe.offres[0]);
            }
        }
    
        return res.json({
            success: true,
            fallback: "Les offres ont ete get avec succes",
            data: offresIndividuelles,
            many: Object.values(offresGroupées).filter(group => group.offres.length > 1)
        });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, fallback: "Failed to get the annonces" });
    }
});

router.get("/getdemandesmap", async (req, res) => {
    try {
        const metier = req.query.metier;
        let query = {};

        if (metier) {
            query.metier = metier;
        }

        let demandes = await Demande.find(query)
            .populate("user", "fullName avatar position addressDetails");
    
        const demandesGroupées = {};
        const demandesIndividuelles = [];
    
        demandes.forEach(demande => {
            const clé = `${demande.user.position.latitude}_${demande.user.position.longitude}`;
            const demandeData = {
                _id: demande._id,
                user: demande.user,
                metier: demande.metier,
                tarif: demande.tarif,
                annonceType: demande.annonceType,
                // autres champs de l'offre que vous souhaitez inclure...
            };
    
            if (demandesGroupées[clé]) {
                demandesGroupées[clé].demandes.push(demandeData);
            } else {
                demandesGroupées[clé] = {
                    user: demande.user,
                    demandes: [demandeData]
                };
            }
        });
    
        // Ajouter le total d'offres et séparer les offres individuelles et groupées
        for (const key in demandesGroupées) {
            const groupe = demandesGroupées[key];
            groupe.totalDemandes = groupe.demandes.length;
    
            if (groupe.demandes.length === 1) {
                demandesIndividuelles.push(groupe.demandes[0]);
            }
        }
    
        return res.json({
            success: true,
            fallback: "Les demandes ont ete get avec succes",
            data: demandesIndividuelles,
            many: Object.values(demandesGroupées).filter(group => group.demandes.length > 1)
        });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, fallback: "Failed to get the demandes" });
    }
});

router.get("/user/:id/:category", async (req, res) => {
    try {
        const id = req.params.id;
        const category = req.params.category;
        let annonces = [];

        if (category === "Offre") {
            annonces = await Offre.find({ user: id }).populate("user", "fullName avatar position addressDetails");
        } else if (category === "Demande") {
            annonces = await Demande.find({ user: id }).populate("user", "fullName avatar position addressDetails");
        }

        return res.json({ success: true, fallback: "Les annonces ont ete get avec succes", data: annonces });
    } catch (error) {
        console.error(error);
        return res.json({ success: false, fallback: "Failed to get the annonces" });
    }
})

module.exports = router;
