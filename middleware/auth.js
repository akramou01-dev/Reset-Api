const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        req.isAuth = false ; 
        return next(); 
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'mustbesecretfornewmadina');
    } catch (err) {
        req.isAuth = false ; 
        return next(); 
    };
    if (!decodedToken) {
        req.isAuth = false ; 
        return next();
    }
    req.user_id = decodedToken.user_id;
    req.isAuth = true ; 
    next();
};