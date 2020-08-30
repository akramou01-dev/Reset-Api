const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');

const imageClear = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}


const graphqlSchema = require('./graphql/schema'); 
const graphqlResolver = require('./graphql/resolvers')
const graphqlHttp = require('express-graphql')
const sequelize = require('./utils/Database');

const Post = require('./models/Post');
const Creator = require('./models/Creator');
const User = require('./models/User');

const multer = require('multer');
const uuidv4 = require('uuid/v4');
const { graphql } = require('graphql');
const auth = require('./middleware/auth'); 
const date = new Date(); 
const fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, date.getTime() + '-' + file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};


// app.use(bodyParser.urlencoded()) // c pour les donnée qui viennes depuis des post <form> 

app.use(bodyParser.json());

app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

app.use('/images', express.static(path.join(__dirname, 'images')));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // pour definir les domain qui peuvent accéder a notre serveur
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH'); //pour ajouter les methodes qu'on peut utiliser
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // pour ajouter un Content-Type et une autorization
    if(req.method==='OPTIONS'){
        return res.sendStatus(200);
    }
    next();
})
app.use(auth); 
app.put('/post-image',(req,res,next)=> {
    if(!req.isAuth){
        const error = new Error('Not authenticated');
        error.code = 500; 
        throw error ;
    }
    if(!req.file){
        return res.status(200).json({
            message :'no file provided!'
        })
    }
    if(req.body.oldPath){
        imageClear(oldPath); 
    }
    return res.status(201).json({message :'file stored', filePath : req.file.path})

})
app.use('/graphql',graphqlHttp({
    schema : graphqlSchema , 
    rootValue : graphqlResolver,
    graphiql : true , 
    //error handling
    customFormatErrorFn (err){
        if (!err.originalError){
            //sytaxe error
            return err;
        }
        const data = err.originalError.data ;
        //le message est dans l'err lorsq   u'on faut new Error(message)
        const message = err.message ||  'An error occured'
        const code = err.originalError.statusCode || 500
        return {
            message : message, 
            code : code , 
            data : data ,
        }
    }
}))

// error midelware
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ data: data, message: message });
});

User.hasMany(Post);

Post.belongsTo(Creator, { constraints: true, onDelete: 'CASCADE' });
Creator.hasMany(Post);

sequelize
// .sync({ force: true })
    .sync()
    .then(result => {
        app.listen(300);
    })
    .catch(err => console.log(err));