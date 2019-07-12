var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var multer = require('multer');
var upload = multer();

var workshopController = require("../controllers/worshopController");

router.get('/api/donors',workshopController.listDonors);

router.post('/api/donors',workshopController.uploadDonor);

router.get('/api/donors/:fname/:lname',workshopController.getDonor);

router.post('/api/donors/:fname/:lname',workshopController.changeDonor);

router.delete('/api/donors/:fname/:lname', workshopController.deleteDonor);

router.get('/api/qdonors',workshopController.queryDonors);

router.get('/api/donors/:id', workshopController.getDonorId);


////////////////////////////////////////////////////////////////////////

router.post('/api/register/donor',upload.none(), workshopController.donorRegistration);

router.post('/api/register/hospital',upload.none(), workshopController.hospitalRegistration);

router.post('/api/login', upload.none(), workshopController.loginAuth);

module.exports = router;
