const express = require('express');
const { transactionalControllerWrapper } = require('../utils/controllerWrapper');
const { loginUser } = require('../controllers/authController');
const { getCustMstData, updateCustMstData } = require('../controllers/custMstController');
const { getEmailData, updateEmailData, addEmailData } = require('../controllers/emailController');

const router = express.Router();

router.post('/login', transactionalControllerWrapper(loginUser));
router.get('/getCustMst', transactionalControllerWrapper(getCustMstData));
router.put('/updateCustMst', transactionalControllerWrapper(updateCustMstData));
router.get('/getEmail', transactionalControllerWrapper(getEmailData));
router.put('/updateEmail', transactionalControllerWrapper(updateEmailData));
router.post('/addEmail', transactionalControllerWrapper(addEmailData));
module.exports = router;