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
        type:String,
        unique : true
    },
    dateOfBirth:{
        type:Date
    },
    followUpRequired:{
        type:Boolean,
        default : false
    },
    allEntries:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'PersonnelHealth'
        }
    ]
});

module.exports = mongoose.model('Personnel',personnelSchema);