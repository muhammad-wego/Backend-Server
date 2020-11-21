const mongoose = require('mongoose');

const consellingSchema = new mongoose.Schema({
    personnel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Personnel'
    },
    dateOfCounselling:{
        type:Date
    },
    summary:{
        type:String
    }
});

module.exports = mongoose.model('Counselling',consellingSchema)