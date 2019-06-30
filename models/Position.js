const mongoose = require('mongoose');

// Model Position
// Модель Должность
const position = mongoose.Schema({
    posName: String
});
module.exports = mongoose.model('Position', position);