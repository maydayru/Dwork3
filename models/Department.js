const mongoose = require('mongoose');

// Model Department
// Модель Отдела
const Department = mongoose.Schema({
    depName: String
});
module.exports = mongoose.model('Department', Department);