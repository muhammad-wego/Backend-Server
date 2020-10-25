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
    isAdmin:{
        type:Boolean
    }
});

exports.Personnel = mongoose.model('Personnel',personnelSchema);