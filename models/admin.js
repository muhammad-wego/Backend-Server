const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    personnelInfo : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Personnel'
    },
    priority:{
        type:Number
    },
    battalion:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Battalion'
    },
    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company'
    }
});

module.exports = mongoose.model('Admins',adminSchema);