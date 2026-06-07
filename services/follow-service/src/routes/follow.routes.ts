//import express
const express = require('express');

//create a router
const router = express.Router();

const followController = require('../controllers/follow.controller');

router.post("/:followerId/:followingId", followController.addFollow);
router.delete("/:followerId/:followingId", followController.unfollow);

router.get("/:id/following", followController.getFollowing);
router.get("/:id/followers", followController.getFollowers);

// TODO: faut il faire une route GET /me/following qui récupère 
// les abonnement de la personne connectée avec auth ?

// Exportation du router pour pouvoir l'utiliser dans l'application
module.exports = router;


