const express = require('express');
const multer = require('multer');
const { transactionalControllerWrapper } = require('../utils/controllerWrapper');
const { loginUser } = require('../controllers/authController');

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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

// File management routes
const {
  uploadFile,
  deleteFile,
  replaceFile,
  getBasePath
} = require('../controllers/fileController');

router.post('/uploadFile', upload.array('files'), uploadFile);
router.post('/deleteFile', deleteFile);
router.post('/replaceFile', upload.array('files'), replaceFile);
router.get('/getBasePath', getBasePath);

const { getAdvEvents } = require('../controllers/getAdvEvents');
router.get('/getAdvEvents', transactionalControllerWrapper(getAdvEvents));

module.exports = router;