let express = require('express'),
bodyParser = require('body-parser');
let app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
let PORT = process.env['PORT'];

require('./config/database');

let listener = app.listen(PORT,function(){
    console.log("Server started on PORT : " + PORT);
});