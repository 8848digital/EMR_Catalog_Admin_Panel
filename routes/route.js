const express = require('express');
const { transactionalControllerWrapper } = require('../utils/controllerWrapper');
const { loginUser } = require('../controllers/authController');

const router = express.Router();

router.post('/login', transactionalControllerWrapper(loginUser));

const { 
  getPMCdList,
  getPSCdList, 
  getNewCategoryList,
  getData, 
  updateData, 
  addData, 
  getOperations, 
  deleteData, 
  validateSize, 
  bulkSaveData 
} = require('../controllers/dynamicController');

router.get('/getOperations', transactionalControllerWrapper(getOperations));
router.get('/getData', transactionalControllerWrapper(getData));
router.put('/updateData', transactionalControllerWrapper(updateData));
router.post('/addData', transactionalControllerWrapper(addData));
router.delete('/deleteData', transactionalControllerWrapper(deleteData));
router.get('/validateSize', transactionalControllerWrapper(validateSize));
router.get('/pmcdList', transactionalControllerWrapper(getPMCdList));
router.get('/pscdList', transactionalControllerWrapper(getPSCdList));
router.get('/newCategoryList', transactionalControllerWrapper(getNewCategoryList));
router.post('/bulkSave', transactionalControllerWrapper(bulkSaveData));

module.exports = router;