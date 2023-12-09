require('dotenv').config();
const express = require('express');
const router = express.Router();
const {adminToken} = require('../middleware/Admin')
const jwt = require('jsonwebtoken');
const { User, Offre, Demande, RemovedAnnonce, UserRemove,} = require('../models/models');
const myVerifyToken = require('../middleware/myVerifyToken');




router.post('/generateAdminToken', (req, res) => {

    try {
        const identifiant = req.body.identifiant;
        const mdp = req.body.mdp;

        if (identifiant === process.env.SECRET_KEY_ADMIN && mdp === process.env.SECRET_ADMIN_MDP) {
            const adminToken = jwt.sign({ admin: true }, process.env.SECRET_KEY_ADMIN, { expiresIn: '1h' });
            res.json({ adminToken });
        } else {
            res.status(401).json({ message: "Accès non autorisé." });
        }
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la vérification :', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

// ROUTE POUR BANIR UN USER 

router.post('/banUser/:phoneNumber', adminToken , async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const { banReason, banDuration } = req.body; 

        const user = await User.findOne({ phoneNumber: phoneNumber });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        if (user.isBanned.status    ) {
            return res.status(400).json({ message: "L'utilisateur est déjà banni." });
        }

        const banEnd = new Date();
        banEnd.setHours(banEnd.getHours() + banDuration);

        user.isBanned.status = true;
        user.isBanned.details = {
            bannedBy:'Admin', // Assurez-vous que l'ID de l'administrateur est accessible via req.user
            banReason,
            banStart: new Date(),
            banEnd
        };
        

        await user.save();

        res.status(200).json({ message: `L'utilisateur a été banni pour ${banDuration} heures.` });

    } catch (error) {
        console.error('Erreur de bannissement de l\'utilisateur:', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

router.post('/unbanUser/:phoneNumber', adminToken, async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        const user = await User.findOne({ phoneNumber: phoneNumber });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        if (!user.isBanned.status) {
            return res.status(400).json({ message: "L'utilisateur n'est pas banni." });
        }

        user.isBanned.lastBans.push({
            bannedBy: 'Admin',
            banReason: user.isBanned.details.banReason,
            banStart: user.isBanned.details.banStart,
            banEnd: user.isBanned.details.banEnd
        });

        user.isBanned.status = false;
        user.isBanned.details = {};

        await user.save();
        res.status(200).json({ message: "L'utilisateur a été débanni." });
        
    } catch (error) {
        console.error('Erreur lors du débannissement de l\'utilisateur:', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

// ROUTES POUR BANIR UNE ANNONCE

router.post('/delete/annonce/:type/:id', adminToken, async (req, res) => {
    const { type, id } = req.params;

    try {
        let annonce;
        let Model;
        
        if (type.toLowerCase() === 'offre') {
            Model = Offre;
        } else if (type.toLowerCase() === 'demande') {
            Model = Demande;
        } else {
            return res.status(400).json({ message: "Type d'annonce invalide." });
        }

        annonce = await Model.findById(id);
        if (!annonce) {
            return res.status(404).json({ message: "Annonce pas trouvée." });
        }

        const removed = new RemovedAnnonce({
            ...annonce.toObject(), 
            deletedDate: new Date() 
        });

        await removed.save();

        await Model.deleteOne({ _id: id });

        res.status(200).json({ message: "Annonce supprimée et archivée avec succès." });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'annonce:', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

router.post('/reintegrate/annonce/:id', adminToken, async (req, res) => {
    const { id } = req.params;

    try {
        const removedAnnonce = await RemovedAnnonce.findById(id);
        if (!removedAnnonce) {
            return res.status(404).json({ message: "Annonce supprimée non trouvée." });
        }

        let Model;

        if (removedAnnonce.annonceType === 'Offre') {
            Model = Offre;
        } else if (removedAnnonce.annonceType === 'Demande') {
            Model = Demande;
        } else {
            return res.status(400).json({ message: "Type d'annonce invalide." });
        }

        const annonce = new Model({
            ...removedAnnonce.toObject(),
            _id: undefined, 
            __v: undefined,
            deletedDate: undefined 
        });

        await annonce.save();

        await RemovedAnnonce.deleteOne({ _id: id });

        res.status(200).json({ message: "Annonce réintégrée avec succès." });

    } catch (error) {
        console.error('Erreur lors de la réintégration de l\'annonce:', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

// Supprimer un utilisateurs 

router.post('/deleteAccount/:phoneNumber' ,adminToken , async (req, res) => {

    const { phoneNumber } = req.params;
    
    try {

    const user = await User.findOne({phoneNumber: phoneNumber})

    if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const removeUser = new UserRemove({
        ...user.toObject(), 
        deletedDate: new Date() 
    });

    await removeUser.save()

    await User.deleteOne({ phoneNumber: phoneNumber })

    res.status(200).json({ message: "Compte supprimée et archivée avec succès." });


    } catch(error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

// remettre un user 

router.post('/reintegrate/user/:phoneNumber', adminToken, async (req, res) => {
    const { phoneNumber } = req.params;

    try {
        const reintegrateUser = await UserRemove.findOne({phoneNumber: phoneNumber });
        if (!reintegrateUser) {
            return res.status(404).json({ message: "Annonce supprimée non trouvée." });
        }


        const user = new User({
            ...reintegrateUser.toObject(),
            __v: undefined,
            removedDate: undefined 
        });

        await user.save();  

        await UserRemove.deleteOne({ phoneNumber: phoneNumber });

        res.status(200).json({ message: "Utilisateur réintégrée avec succès." });

    } catch (error) {
        console.error('Erreur lors de la réintégration du user:', error);
        res.status(500).json({ message: 'Une erreur interne est survenue.' });
    }
});

// User info 

router.get('/users',adminToken, async (req, res) => {
    try {
      // Assurez-vous que cette route est protégée et accessible uniquement par les administrateurs.
    
      // Compter le nombre total d'utilisateurs.
      const totalUsersCount = await User.countDocuments();
    
      // Utilisez l'agrégation pour compter le nombre d'offres et de demandes par utilisateur.
      const users = await User.aggregate([
        {
          $lookup: {
            from: "offres",
            localField: "_id",
            foreignField: "user",
            as: "offresInfo",
          },
        },
        {
          $lookup: {
            from: "demandes",
            localField: "_id",
            foreignField: "user",
            as: "demandesInfo",
          },
        },
        {
          $project: {
            fullName: 1,
            phoneNumber: 1,
            totalOffres: { $size: "$offresInfo" },
            totalDemandes: { $size: "$demandesInfo" },
          },
        },
      ]);
    
      // Renvoyez les données récupérées au client, y compris le compte total.
      res.json({ success: true, totalUsersCount, users });
    
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ success: false, fallback: "Échec de la récupération des utilisateurs" });
    }
  });
  
  router.get('/banned-users', async (req, res) => {
    try {
      // Assurez-vous que cette route est protégée et accessible uniquement par les administrateurs.
  
      const totalBannedUsersCount = await User.countDocuments({ 'isBanned.status': true });
      
      const bannedUsers = await User.find({ 'isBanned.status': true }, 'fullName _id')
                                     .lean();
  
      res.json({ 
        success: true, 
        totalBannedUsersCount, 
        bannedUsers: bannedUsers.map(user => ({
          fullName: user.fullName,
          _id: user._id
        }))
      });
  
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ success: false, fallback: "Échec de la récupération de la liste des utilisateurs bannis" });
    }
  });
  


module.exports = router; 
