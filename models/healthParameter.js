const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    name:{
        type:String
    },
    score:{
        type:Number
    }
});

const healthParameterSchema = new mongoose.Schema({
    name:{
        type:String
    },
    lowerRange:{
        type:Number
    },
    upperRange:{
        type:Number
    },
    normalPresence:{
        type:Boolean
    },
    type : {
        type: String
    },
    stages:[stageSchema]
});

module.exports = mongoose.model('HealthParameter',healthParameterSchema);