const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

exports._sign_in_checks = [
    check('username').exists(),
    check('password').isLength({min: 6}).exists()
];

exports._register_checks = [
    check('username').exists(),
    check('password').isLength({min:6}).exists()
];