const mongoose = require('mongoose');

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
    stages:[{
        type:String
    }]
});

module.exports = mongoose.model('HealthParameter',healthParameterSchema);