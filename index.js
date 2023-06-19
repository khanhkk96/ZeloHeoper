const express = require('express');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const initRouter = require('./routes');
const session = require('express-session');
const runJob = require('./services/message.consumer');
// const http = require('http');
// const signale = require('signale');

var app = express();

//load enviroment variables
const result = dotenv.config();
if (result.error) {
    throw result.error;
}
console.log('***DB_URI: ', process.env.DB_URI);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1); // trust first proxy
app.use(
    session({
        secret: 'zakakaza',
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true },
    }),
);

app.use(morgan('combined'));

//connect MongoDB
mongoose.connect(
    process.env.DB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoCreate: true,
    },
    function (err) {
        if (err) {
            console.log(`Mongo connected error ${err}`);
        } else {
            console.log('Mongo connected');
        }
    },
);

//init router
initRouter(app);

app.listen(process.env.PORT);
console.log(`Server is running in port ${process.env.PORT}....`);

//init job
if (JSON.parse(process.env.RUN_JOB)) {
    console.log('Running job...');
    runJob();
}
