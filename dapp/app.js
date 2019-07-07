
// =============================================================================================
// SETUP
// =============================================================================================
const express = require('express'),
    app = express(),
    path = require('path'), // ADDED for uploading the files, a core nodejs module 
    crypto = require('crypto'), // ADDED to generata the files name, a core nodejs module
    mongoose = require('mongoose'),
    multer = require('multer'), // ADDED to handle encytpe=multipart/data as bodyparser is not able to handle it
    GridFsStorage = require('multer-gridfs-storage'), // to work gridfs with multer
    Grid = require('gridfs-stream'), // ADDED to display images of uploaded files
    passport = require('passport'),
    bodyParser = require('body-parser'),
    LocalStrategy = require('passport-local'),
    methodOverride = require('method-override'),
    expressSanitizer = require('express-sanitizer'),
    User = require('./models/user'),
    // seedDatabase = require('./models/seed'), // commented otherwise it still seeds the db
    port = 3000;

app.set("view engine", "ejs");

app.use(require('express-session')({
    secret: 'Mana is a dapp',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // for uploading files???
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride("_method"));
app.use(expressSanitizer()); // this line after app.use(bodyParser.urlencoded({ extended: true }));

/**
 * THese two methods are really important : 
 * Deserialize: for reading the session, taking the data from the session and 
 * decoding it
 * Serialize: encodes the data. 
 * This is possible thanks to passport-local-mongoose. Do not forget the parenthesis
 * at the end of the method authenticate, serializeUser and deserializeUser. Otherwise
 * you won't see any errors nor does the application work as intended, thus causing
 * a lot of headaches.
 */
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware that allows to inject currentUser to each template, especially
// in the header and footer. Inside js files, I simply use req.user
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});



// =============================================================================================
// DB STUFF : MongoDB needs to be running https://mongoosejs.com/
// =============================================================================================

mongoose.connect("mongodb://localhost:27017/mana", { useNewUrlParser: true, useFindAndModify: false });

// seedDatabase(); // resets the database with seed data

// create mongo connection
const conn = mongoose.createConnection("mongodb://localhost:27017/mana", { useNewUrlParser: true });

// init gfs
let gfs;

conn.once('open', () => {
    // initialized stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// create storage engine, check documentation on multer-gridfs-storage
const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/mana',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            })
        });
    }
});
const upload = multer({ storage });
// =============================================================================================
// ROUTES
// =============================================================================================

/**
 * @route GET /upload
 * @description loads form
 */
app.get('/upload', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // check if files exist
        if (!files || files.length === 0) {
            res.render('upload', { files: false });
        } else {
            files.map(file => {
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                    file.isImage = true;
                } else {
                    file.isImage = false;
                }
            });
            res.render('upload', { files: files });
        }
    });
});

/**
 * @route POST /upload
 * @description uploads file to db
 */
app.post('/upload', upload.single('file'), (req, res) => {
    // res.json({ file: req.file });
    res.redirect('/upload');
});

/**
 * @route GET /files
 * @description display all files in JSON
 */
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // check if files exist
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: 'No files exist'
            });
        }

        // files exist
        return res.json(files);
    });
});


/**
 * @route GET /files/:filename
 * @description display a specific file in JSON
 */
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // check if file exists
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: '"No such file exists'
            });
        }

        // file exists
        return res.json(file);
    });
});



/**
 * @route GET /image/:filename
 * @description display image
 */
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // check if file exists
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: '"No such file exists'
            });
        }

        // check if it is an image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            // read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});


/**
 * @route DELETE /files/:id
 * @description delete file
 */
app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
        if (err) {
            return res.status(404).json({
                err: err
            });
        }
        res.redirect('/upload');
    });
});

const authRoutes = require('./routes/auth'),
    privateRoutes = require('./routes/private'),
    homeRoutes = require('./routes/home'),
    eRecordRoutes = require('./routes/e-record'),
    toolsRoutes = require('./routes/tools'),
    documentationRoutes = require('./routes/documentation'),
    accountRoutes = require('./routes/account'),
    messageRoutes = require('./routes/messages'),
    contactRoutes = require('./routes/contact'),
    faqRoutes = require('./routes/faq');

app.use('/', authRoutes);
app.use('/private', privateRoutes);
app.use('/home', homeRoutes);
app.use('/e-record', eRecordRoutes);
app.use('/tools', toolsRoutes);
app.use('/documentation', documentationRoutes);
app.use('/account', accountRoutes);
app.use('/messages', messageRoutes);
app.use('/contact', contactRoutes);
app.use('/faq', faqRoutes);

// DEFAULT ROUTE IF NOTHING ELSE MATCHES
app.get('*', function (req, res) {
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Running at https://localhost:${port}`);
});

// =============================================================================================
// FUNCTIONS
// =============================================================================================
function sanitize_text(req) {
    req.body.file.shared = req.body.file.shared ? true : false;

    // sanitize file.fileName and file.note 
    req.body.file.fileName = req.sanitize(req.body.file.fileName);
    req.body.file.note = req.sanitize(req.body.file.note);
}

/**
 * Our middleware for authoritisation and authentication
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
}