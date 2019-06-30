const Depart = require('../models/Department');
const User = require('../models/user');
const Post = require('../models/Position');
const Message = require('../models/Message');
const News = require('../models/News');
const upload = require('../Database/upload');
const path = require('path');
const Resize = require('../processing/imageresize');
const moment = require('moment');
const io = require("socket.io");

module.exports = function(app, passport) {

    // =====================================
    // FriendsList SECTION          ========
    // Список друзей                ========
    // =====================================

    app.post('/sub', isLoggedIn, function(req, res) {
        let friend = {"friendId": req.body.friend_id, "friendName": req.body.friend_name, "friendPhoto": req.body.friend_photo, "friendStatus": 'Sub'};
        User.findByIdAndUpdate({_id: req.user.id},{$push: {friendsList: friend}}, function (err) {
            if (err)
            {
                console.log(err);
            }
            res.redirect('/profile');
        })
    });

    app.post('/unsub', isLoggedIn, function(req, res) {
        let friend = {"friendId": req.body.friend_id, "friendName": req.body.friend_name, "friendPhoto": req.body.friend_photo, "friendStatus": 'Sub'};
        User.findByIdAndUpdate({_id: req.user.id},{$pull: {friendsList: friend}}, function (err) {
            if (err)
            {
                console.log(err);
            }
            res.redirect('/profile');
        })
    });

    // =====================================
    // NEWS SECTION                 ========
    // Новости                      ========
    // =====================================

    // Render main news page
    // Отображаем главную страницу новостей
    app.get('/news',isLoggedIn,  function(req, res) {
        News.find({}, function (err, data) {
            if (err)
            {
                console.log(err);
            }
            res.render('news.hbs', {user : req.user, newsList : data});
        })
    });

    // Render adding news page
    // Отображаем страницу добавление новости
    app.get('/addnews',isLoggedIn,  function(req, res) {
        res.render('addnews.hbs', {user : req.user});
    });

    // Handle adding news and insert news to DB
    // Подхватываем данные новости и добавляем их в базу данных
    app.post('/postnews',isLoggedIn, upload.single('newsimage'), async function(req, res) {
        if (req.file){
            const imagePath = path.join(__dirname, '../public/news_image/');
            const fileUpload = new Resize(imagePath);
            const filename = await fileUpload.save(req.file.buffer);
            let news = new News();
            news.title = req.body.title;
            news.message = req.body.message;
            news.author = req.user.local.name;
            news.newsimage = 'news_image/'+filename;
            news.date = moment().format('D.M.YYYY');
            news.save(function (err) {
                if (err)
                {
                    throw err
                }
                res.redirect('/news');
            })
        }
    });

    // Render one news page
    // Отображем страницу новости
    app.get("/newspage/:id", function (req, res) {
        News.findById(req.params.id, function(error, newspage) {
            if (error)
            {
                console.log(error);
            }
            res.render('newspage.hbs',{newsInfo : newspage, user: req.user});
        })
    });

    // Render edit news page
    // Отображаем страницу редактирования новости
    app.get("/editnews/:id", function (req, res) {
        News.findById(req.params.id, function(error, newspage) {
            if (error)
            {
                console.log(error);
            }
            res.render('editnews.hbs',{newsInfo : newspage, user: req.user});
        })
    });

    // Handle updating news and insert updates news to DB
    // Обрабатываем обновление новости и добавляем новые данные в базу
    app.post("/updatenews", (req, res) => {
        News.findByIdAndUpdate({_id: req.body.newsid},{'title': req.body.title, 'message': req.body.message, 'date': moment().format('D.M.YYYY')}, function(error, newspage) {
            if (error)
            {
                console.log(error);
            }
            res.redirect('/news');
        })
    });

    // Handle deleting news and remove news from DB
    // Обрабатываем удаление новости и удаление ее из базы
    app.get("/delnews/:id", function (req, res) {
        News.findByIdAndRemove({_id: req.params.id}, function(error, newspage) {
            if (error)
            {
                console.log(error);
            }
            res.redirect('/news');
        })
    });

    // =====================================
    // Users SECTION                ========
    // Пользовательские страницы    ========
    // =====================================

    // Render user page
    // Отображаем страницу пользователя
    app.get("/userpage/:id", function(req, res) {
        User.findById(req.params.id, function(error, userpage) {
            if (error)
            {
                console.log(error);
            }
            let fStatus = null;
            req.user.friendsList.map(function (person)
            {
                if (person.friendId === req.params.id)
                {
                     fStatus = 'Sub'
                }
                else
                {
                     fStatus = 'Unsub'
                }
            });
            res.render('userpage.hbs',{userInfo : userpage, user: req.user, friendStatus : fStatus,friendsList: userpage.friendsList, friendsCnt : userpage.friendsList.length});
        })
    });

    // =====================================
    // HOME PAGE                    ========
    // Главная страница             ========
    // =====================================

    // Render main page
    // Отображаем главную страницу
    app.get('/', isLoggedIn, function(req, res) {
        res.redirect('/profile');
    });

    // Render contacts page
    // Отображаем страницу контактов
    app.get("/contact", isLoggedIn, (req, res) => {
        User.find({}, function(error, users) {
            res.render('contact.hbs',{usersList : users, user: req.user});
        })
    });

    // Render tasks page
    // Отображаем страницу задач
    app.get('/tasks',isLoggedIn,  function(req, res) {
        res.render('task.hbs');
    });

    // Render knowledge base page
    // Отображаем страницу базы знаний
    app.get('/base',isLoggedIn,  function(req, res) {
        res.render('base.hbs');
    });

    // Render lockscreen page
    // Отображаем страницу блокировки
    app.get('/lock', function (req, res) {
        res.render('locksreen.hbs', {user: req.user});
        req.logout();
    });

    // =====================================
    // LOGIN ===============================
    // Авторизация  ========================
    // =====================================

    // show the login form
    // отображаем форму авторизации
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        // отображаем страницу и передаем данные об авторизации, если они есть
        res.render('login.hbs', { message: req.flash('loginMessage') });
    });

    // process the login form
    // обратаываем форму авторизации
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section редиректим в защищеную часть
        failureRedirect : '/login', // redirect back to the signup page if there is an error если есть какие-то ошибки, то перенаправляем на страницу авторизации
        failureFlash : true // allow flash messages разрешаем сообщения об ошибках
    }));

    // =====================================
    // SIGNUP ==============================
    // Регистрация =========================
    // =====================================

    // show the signup form
    // отображаем форму регистрации
    app.get('/signup', function(req, res) {
        res.render('register.hbs',{ message: req.flash('signupMessage')});
    });

    // process the signup form
    // обрабатываем форму регистрации
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section редиректим в защищеную часть
        failureRedirect : '/login', // redirect back to the signup page if there is an error если есть какие-то ошибки, то перенаправляем на страницу регистрации
        failureFlash : true // allow flash messages разрешаем сообщения об ошибках
    }));

    // =====================================
    // PROFILE SECTION =====================
    // Профиль пользователя ================
    // =====================================

    // we will want this protected so you have to be logged in to visit
    // у нас защищенная часть, для которая нужна авторизация
    // we will use route middleware to verify this (the isLoggedIn function)
    // для проверки авторизация будет использоваться функция isLoggedIn
    app.get('/profile', isLoggedIn, function(req, res) {
        News.find({}, function (err, newsData) {
            if (err)
            {
                console.log(err);
            }
            User.findById({_id:req.user.id},function (err,data) {
                res.render('main.hbs', {user : req.user, friendsList: data.friendsList, friendsCnt : data.friendsList.length, newsList: newsData });
            });
        })
    });

    // =====================================
    // User's message  =====================
    // Сообщение от пользователя ===========
    // =====================================

    // posting user's message
    // публикация статуса пользователя (аналог статуса ВК)
    app.post('/postStatus', function (req, res) {
       User.findByIdAndUpdate({_id: req.user.id},{'local.lastStatus': req.body.textStatus},function (err) {
           if (err)
           {
               console.log(err);
           }
           res.redirect('/profile');
       })
    });

    // deleting user's message
    // удаление статуса
    app.post('/delStatus', function (req, res) {
        User.findByIdAndUpdate({_id: req.user.id},{'local.lastStatus': null},function (err) {
            if (err)
            {
                console.log(err);
            }
            res.redirect('/profile');
        })
    });

    // =====================================
    // CHAT SECTION    =====================
    // Чат             =====================
    // =====================================

    // sending message in group chat
    // обработка отправки сообещния в групповой чат
    app.post("/chats", async function(req, res)  {
        try {
            const chat = new Message();
            chat.name = req.user.name;
            chat.message = req.body.usrmsg;
            await chat.save();
            res.sendStatus(200);
            //Emit the event
            io.emit("chat", req.body);
        } catch (error) {
            res.sendStatus(500);
            console.error(error);
        }
    });

    // render chat page
    // отображение страницы чата
    app.get("/chat", function (req, res) {
            res.render('chat.hbs', {user: req.user});
        });


    // =====================================
    // EDIT PROFILE SECTION ================
    // Редактирование профиля ==============
    // =====================================

    // we will want this protected so you have to be logged in to visit
    // у нас защищенная часть, для которая нужна авторизация
    // we will use route middleware to verify this (the isLoggedIn function)
    // для проверки авторизация будет использоваться функция isLoggedIn

    // render user's edit page
    // отображаем страницу редактирования информации
    app.get('/editinfo',isLoggedIn,function(req, res) {
        Depart.find({}, function (err, deps) {
            if(err)
                console.log(err);
            Post.find({}, function (err,posts) {
                if (err)
                    console.log(err);
                res.render('editinfo.hbs' ,{ depsList: deps, postsList : posts, user : req.user});
            });
        });
    });

    // handle update user's page
    // обработка обновления информации об пользователе
    app.post('/updateinfo',isLoggedIn, upload.single('userphoto'), async function (req, res) {
            if (req.file){
            const imagePath = path.join(__dirname, '../public/user_image/');
            const fileUpload = new Resize(imagePath);
            const filename = await fileUpload.save(req.file.buffer);
                // if upload new avatar
                // Если пользователь загружает новый аватар
                User.findByIdAndUpdate({_id:req.user.id},{
                    'local.name': req.body.username,
                    'local.email':req.body.useremail,
                    'local.birthdate':req.body.userbirthdate,
                    'local.phone':req.body.userphone,
                    'local.department':req.body.userdep,
                    'local.photo': 'user_image/'+filename,
                    'local.gender':req.body.usergender,
                    'local.position':req.body.userpost}, function(err) {
                    if (err){
                        console.log(err);
                    }
                });
            }
            // if using old avatar
            // Используем старый аватар пользователя
            else {
                User.findByIdAndUpdate({_id:req.user.id},{
                    'local.name': req.body.username,
                    'local.email':req.body.useremail,
                    'local.birthdate':req.body.userbirthdate,
                    'local.phone':req.body.userphone,
                    'local.department':req.body.userdep,
                    'local.gender':req.body.usergender,
                    'local.position':req.body.userpost}, function(err) {
                    if (err){
                        console.log(err);
                    }
                });
            }
            res.redirect('/profile');
    });

    // =====================================
    // LOGOUT ==============================
    // Выход  ==============================
    // =====================================

    // handle logout
    // обработка выхода из профиля
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
        });
    };


    // route middleware to make sure a user is logged in
    // функция проверки авторизации
    function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    // если пользователь авторизован, то перенаправляешь дальше
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the login page
    // если пользователь не авторизован, то перенапрвляем на страницу авторизации
    res.redirect('/login');
    }