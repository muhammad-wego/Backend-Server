const express = require('express');
const router = express.Router();
const record = require('../../../models/personnelHealth');
const personnel = require('../../../models/personnel');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');
const { response } = require('express');

router.post('/latest',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    let getPersonnels = () => {
        return new Promise((resolve,reject)=>{
            personnel.find().then(personnels => {
                let latestForms = [];
                personnels.forEach((person,i) => {
                    latestForms.push(person.allEntries[person.allEntries.length-1]);
                });
                resolve(latestForms);
            })
            .catch(err => reject(err));
        });
    }

    let getForm = (formID) => {
        return new Promise((resolve,reject) => {
            record.findOne({_id:formID}).then(form => {resolve(form)})
            .catch(err => reject(err));
        })
    }
    
    let getLatest = async() => {
        let response = [];
        let forms = await getPersonnels();
        for(let formID of forms){
            await getForm(formID).then((_form)=>{console.log(_form);response.push(_form)})
            .catch((err)=>{console.log(err)});
        }
        await console.log(response);
        return response;
    }

    getLatest().then(function(result){
        return res.status(200).json({forms:result});
    }).catch(err =>{
        console.log(err);
        res.status(500).json({message : "Internal Server Error"})});

 });

router.post('/:type/:healthParam/:query',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    let getPersonnels = () => {
        return new Promise((resolve,reject)=>{
            personnel.find().then(personnels => {
                let latestForms = [];
                personnels.forEach((person,i) => {
                    latestForms.push(person.allEntries[person.allEntries.length-1]);
                });
                resolve(latestForms);
            })
            .catch(err => reject(err));
        });
    }

    let getForm = (formID) => {
        return new Promise((resolve,reject) => {
            record.findOne({_id:formID}).then(form => {resolve(form)})
            .catch(err => reject(err));
        })
    }
    
    let getLatest = async() => {
        let response = [];
        let forms = await getPersonnels();
        for(let formID of forms){
            await getForm(formID).then((_form)=>{
                if(_form != null)
                _form.parameters.forEach((param,i)=>{
                    if(param.healthParameter==req.params.healthParam){
                        response.push(_form.personnel);
                    }
                })
            })
            .catch((err)=>{console.log(err)});
        }
        return response;
    }

    getLatest().then(function(result){
        return res.status(200).json({personnels:result});
    }).catch(err =>{
        console.log(err);
        res.status(500).json({message : "Internal Server Error"})});
/*
    record.find({parameters:{$elemMatch:{healthParameter:ObjectId(req.params.healthParam)}}}).then(records => {
        let response = [];
        records.forEach((currentRecord,i) => {
            currentRecord.parameters.forEach((param,j)=>{
                if(param[req.params.type] == req.params.query)
                    response.push(currentRecord.personnel);
            });
        });
        return res.status(200).json({records:response});
    }).catch(err => {
        console.log(err);
        return res.status(500).json({message : "Internal Server Error"});
    })*/
});

module.exports = router;