let express = require('express'),
bodyParser = require('body-parser');
let app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

let PORT = process.env['PORT'];

require('./config/database');

// Routers
let loginRouter = require('./routes/api/v1/login');
let registerRouter = require('./routes/api/v1/register');

// Routes
app.use('/api/v1/login',loginRouter);
app.use('/api/v1/register',registerRouter);

let listener = app.listen(PORT || 3000,function(){
    console.log("Server started on PORT : " + PORT);
});