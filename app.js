const express  = require('express');
const app      = express();
const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('express-session');
const exphbs  = require('express-handlebars');
const configDB = require('./Database/Config.js');
const path = require('path');
const mongo = require('mongodb').MongoClient;
const client2 = require('socket.io').listen(4000).sockets;
const moment = require('moment');

// configuration ===============================================================
// настройки     ===============================================================
mongoose.connect(configDB.url, { useNewUrlParser: true, useFindAndModify: false }); // connect to our database

require('./Database/passport')(passport); // pass passport for configuration

mongo.connect('mongodb://localhost/DworkDB/', { useNewUrlParser: true },function(err, client){
    if(err){
        throw err;
    }
    // Connect to Socket.io
    // Подключаемся к Socket.io
    client2.on('connection', function(socket){
        let db = client.db('DworkDB');
        let chat = db.collection('messages');

        // Create function to send status
        // Создаем функцию отправки статуса
        sendStatus = function(s){
            socket.emit('status', s);
        };

        // Get chats from mongo collection
        // Подгружаем чаты из базы
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        // Обработка формы ввода сообщения
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;
            let usrimage = data.usrimage;
            let date = moment().format('D.M.YYYY HH:mm');
            // Check for name and message
            // Проверяем наличие имени пользователя и текста сообщения
            if(name === '' || message === ''){
                // Send error status
                // Отправка ошибки
                sendStatus('Пожалуйста, введите сообщение');
            } else {
                // Insert message
                // Сохранение сообещния
                chat.insertOne({name: name, message: message, usrimage: usrimage, date: date}, function(){
                    client2.emit('output', [data]);

                    // Send status object
                    // Отправка статуса
                    sendStatus({
                        message: 'Сообщение отправлено',
                        clear: true
                    });
                });
            }
        });
    });
});


app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

let hbs = exphbs.create({
    // Specify helpers which are only registered on this instance
    // Здесь добавил хелперы, чтобы сравнивать два значения
    helpers: {
        equals: function (val1, val2, options)
        {
            return val1 === val2 ? options.fn(this) : options.inverse(this);
        }
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', 'handlebars');


app.use(session({ secret: 'ilovebeer',
resave:true,
saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, '/public/')));
// routes ======================================================================
// маршруты ====================================================================
require('./routes/routes.js')(app, passport);

// launch ======================================================================
// запуск ======================================================================

module.exports = app;
