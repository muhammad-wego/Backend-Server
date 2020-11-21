const mongoose = require('mongoose');

const personnelSchema = new mongoose.Schema({
    personnelName:{
        type:String,
        required:true,
    },
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company'
    },
    rank:{
        type:String
    },
    metalNo:{
        type:String
    },
    dateOfBirth:{
        type:Date
    },
    lastEntry:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'PersonnelHealth'
    },
    followUpRequired:{
        type:Boolean
    }
});

module.exports = mongoose.model('Personnel',personnelSchema);