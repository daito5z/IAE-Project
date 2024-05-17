const express = require("express");
const authController = require("../controllers/auth.js");
const router = express.Router();

// Routes for user authentication and registration
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Routes for conductor functionality
router.post('/conductor/update-details', authController.update);
router.post('/conductor/election', authController.conductElection);
router.get('/conductor/getVotingLink', authController.getVotingLink);
router.post('/conductor', authController.userdata);
router.post('/voter-login/:token/:id',authController.authenticateAndRenderVoterPage);
router.post('/verifyOTP',authController.verifyOTP);
router.post('/cast-vote',authController.castVote);

// Route for voter login (if applicable)
module.exports = router;
