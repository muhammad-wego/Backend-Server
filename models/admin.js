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
    }
});

exports.Admin = mongoose.model('Admins',adminSchema);