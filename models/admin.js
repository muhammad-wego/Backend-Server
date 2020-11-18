const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true
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
    }
});

module.exports = mongoose.model('Admins',adminSchema);