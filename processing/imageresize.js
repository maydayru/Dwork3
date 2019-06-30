const sharp = require('sharp');
const uuidv4 = require('uuid/v4');
const path = require('path');

// this lib we are using for image resize
// данную библиотеку мы используем для изменения размера загружаемых изображений
class Resize {
    constructor(folder) {
        this.folder = folder;
    }
    async save(buffer) {
        const filename = Resize.filename();
        const filepath = this.filepath(filename);
        await sharp(buffer)
            .resize(128, 128, {
                fit: 'contain',
                position: 'center',
                withoutEnlargement: true
            })
            .toFile(filepath);
        return filename;
    }
    static filename() {
        return `${uuidv4()}.png`;
    }
    filepath(filename) {
        return path.resolve(`${this.folder}/${filename}`)
    }
}
module.exports = Resize;