
// load all the things we need
// подгружаем локальную авторизацию
let LocalStrategy   = require('passport-local').Strategy;

// load up the user model
// подгружаем модель Пользователь
let User            = require('../models/user');


// expose this function to our app using module.exports
// экспортируем эту функцию в приложение
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // Настройки Passport     ==================================================
    // =========================================================================
    // required for persistent login sessions
    // нужно для логин сессий
    // passport needs ability to serialize and unserialize users out of session
    // паспорту нужна возможность сериализировать и десериализировать пользователя

    // used to serialize the user for the session
    // используется для сериализации пользователя
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    // используется для десериализации пользователя
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // Локальная регистрация ===================================================
    // =========================================================================

        passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            // стандартно при использовании локальной стратегии исползуется логин и пароль, но мы перегрузим и будем использовать вместо логина почту
            usernameField : 'email',
            passwordField : 'password',
            nameField : 'name',
            groupField : 'group',
            birthdateField : 'birthdate',
            avatarField: 'avatar',
            passReqToCallback : true // allows us to pass back the entire request to the callback
                                     // данная опция позволяет передавать входящие запросы в коллбэк
        },
        function(req, email, password, done) {

            // asynchronous
            // асинхронно
            // User.findOne wont fire unless data is sent back
            // User.findOne не сработает, если данные не будут отправлены в ответ
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // ищем пользователя с такой же почтой, как и указанной на форме
                // checking to see if the user trying to login already exists
                // здесь выполняется обработка, если данная почта уже занята
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    // если есть другие ошибки, то возвращаем их
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    // выводим сообщение "почта занята"
                    if (user)
                    {
                        return done(null, false, req.flash('signupMessage', 'Данная почта уже занята'));
                    }
                    else {

                        // if there is no user with that email
                        // если пользователь с такой почтой не найден
                        // create the user
                        // создаем пользователя
                        let newUser  = new User();

                        // set the user's local credentials
                        // задаем пользователю значения
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.local.name = req.body.name;
                        newUser.local.avatar = 'user_image/nophoto.png';

                        // сохраняем пользователя
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));


    // =========================================================================
    // LOCAL LOGIN =============================================================
    // Локальная авторизация ===================================================
    // =========================================================================
    // using named strategies since we have one for login and one for signup
    // используем именную стратегию, так как у нас есть один логин для авторизации и для регистрации

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            // стандартно при локальной стратегии используется юзернем и пароль, но мы перезапишем его почтой
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
                                     // данная опция позволяет передавать входящие запросы в коллбэк
        },
        function(req, email, password, done) { // callback with email and password from our form
                                               // коллбэк с почтой и паролем с формы

            // find a user whose email is the same as the forms email
            // ищем пользователя с такой же почтой, как и на форме
            // we are checking to see if the user trying to login already exists
            // обрабатываем ошибки при авторизации
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error before anything else
                // если есть какие-либо другие ошибки, возвращаем их до Если
                if (err)
                    return done(err);

                // if no user is found, return the message
                // если пользователь не найден, то возвращаем текст с ошибкой
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'Пользователь с таким логином не найден'));
                // if the user is found but the password is wrong
                // если пользователь найден, но пароль не правильный
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Неправильный пароль'));

                // all is well, return successful user
                // если все хорошо, то авторизуем пользователья
                return done(null, user);
            });
        }));
};
