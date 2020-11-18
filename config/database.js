const mongoose = require('mongoose');
const db_uri = 'mongodb://adminUser:password123@localhost:27017/ksrp';

const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    poolSize: 10
}

mongoose.connect(db_uri,options).then(
    () => {
        console.log("Database Connection Established");
    },
    err => {
        console.log("Error Connecting To Database. Error : " + err);
    }
);