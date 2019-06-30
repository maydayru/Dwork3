const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

// Model User
// Модель Пользователь
const userSchema = mongoose.Schema({

    local: {
        _id: String,
        email: String,
        password: String,
        name: String,
        group: String,
        birthdate: String,
        gender: String,
        phone: String,
        position: String,
        department: String,
        photo: {type: String, default: 'images/nophoto.png'},
        lastStatus: {type: String, default: null}
    },

    friendsList: [{
        friendId: String,
        friendName: String,
        friendPhoto: String,
        friendStatus: {type: String, default: 'NoSub'}
    }],
 });

// methods ======================
// методы ======================
// generating a hash
// хэшируем пароль
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
// проверяем пароль
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
// создаем модель для пользователей и отправляем ее в приложение
module.exports = mongoose.model('User', userSchema);

