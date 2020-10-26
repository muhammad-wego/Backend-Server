const express = require('express');
const router = express.Router();
const personnel = require('../../../models/admin');

const AuthController = require('../../../contollers/AuthController');

router.post('/',AuthController._sign_in_checks,function(req,res){
    return res.status(200).json({msg:"Logged In",token:"undefined"});
});

module.exports = router;