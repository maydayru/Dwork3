const multer = require('multer');

//we are using Multer for file uploads
//для загрузки файлов используем Multer
const upload = multer({
    limits: {
        fileSize: 32 * 1920 * 1080 // задаем максимальные параметры для изображения set max size for images
    }
});

module.exports = upload;