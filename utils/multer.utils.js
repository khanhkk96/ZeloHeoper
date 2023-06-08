const path = require('path');
const multer = require('multer');
const slugify = require('slugify');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf8',
        );
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e2);
        const ext = path.extname(file.originalname);
        cb(
            null,
            slugify(path.parse(file.originalname).name, {
                replacement: '-', // replace spaces with replacement character, defaults to `-`
                remove: undefined, // remove characters that match regex, defaults to `undefined`
                lower: false, // convert to lower case, defaults to `false`
                strict: false, // strip special characters except replacement, defaults to `false`
                locale: 'vi', // language code of the locale to use
                trim: true,
            }) +
                '-' +
                uniqueSuffix +
                ext,
        );
    },
});

const uploadOnlyExcel = multer({
    dest: './uploads/',
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: function (req, file, callback) {
        console.log(file);
        var ext = path.extname(file.originalname);

        if (ext !== '.xlsx') {
            return callback(new Error('File upload must be .xlsx file'), false);
        }

        callback(null, true);
    },
});

module.exports = { uploadOnlyExcel };
