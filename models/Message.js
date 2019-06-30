const mongoose = require('mongoose');

// Model Message
// Модель Сообщение
const Message = mongoose.Schema({
    name: String,
    message: String,
    date: Date,
    usrimage: String
});
module.exports = mongoose.model('Message', Message);