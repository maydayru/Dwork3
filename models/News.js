const mongoose = require('mongoose');

// Model News
// Модель Новость
const News = mongoose.Schema({
    title: String,
    message: String,
    date: String,
    newsimage: String,
    author: String
});
module.exports = mongoose.model('News', News);