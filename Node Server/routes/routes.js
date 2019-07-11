var express = require('express');
var router = express.Router();

var workshopController = require("../controllers/worshopController");

router.get('/api/donors',workshopController.listDonors);

router.post('/api/donors',workshopController.uploadDonor);

router.get('/api/donors/:fname/:lname',workshopController.getDonor);

router.post('/api/donors/:fname/:lname',workshopController.changeDonor);

router.delete('/api/donors/:fname/:lname', workshopController.deleteDonor);

router.get('/api/qdonors',workshopController.queryDonors);


////////////////////////////////////////////////////////////////////////

router.post('/api/register/donor', workshopController.donorRegistration);

router.post('/api/register/hospital', workshopController.hospitalRegistration);

router.post('/api/login', workshopController.loginAuth);

module.exports = router;
