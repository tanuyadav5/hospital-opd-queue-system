const express = require("express");
const { getDepartments, getDisplay } = require("../controllers/department.controller");

const router = express.Router();

router.get("/", getDepartments); // public: patients pick a department
router.get("/display", getDisplay); // public: waiting-hall screen

module.exports = router;
