let express = require('express'),
bodyParser = require('body-parser');
let app = express();

let cors = require('cors'); 

require('dotenv').config({path: __dirname+'/.env'});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(cors())

let PORT = process.env['PORT'];

require('./config/database');

// Routers
let loginRouter = require('./routes/api/v1/login');
let registerRouter = require('./routes/api/v1/register');
let battalionRouter = require('./routes/api/v1/battalion');
let companyRouter = require('./routes/api/v1/company');
let personnelRouter = require('./routes/api/v1/personnel');
let healthParamRouter = require('./routes/api/v1/healthParameter');
let healthRouter = require('./routes/api/v1/health');
let filterRouter = require('./routes/api/v1/filter');

// Routes
app.use('/api/v1/login',loginRouter);
app.use('/api/v1/register',registerRouter);
app.use('/api/v1/battalion',battalionRouter);
app.use('/api/v1/company',companyRouter);
app.use('/api/v1/personnel',personnelRouter);
app.use('/api/v1/healthParameter',healthParamRouter);
app.use('/api/v1/health',healthRouter);
app.use('/api/v1/filter',filterRouter);

let listener = app.listen(PORT || 3000,function(){
    console.log("Server started on PORT : " + PORT);
});