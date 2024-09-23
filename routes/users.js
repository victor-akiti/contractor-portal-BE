const router = require("express").Router()
const { Router } = require("express")
const { fetchAllEndUsers, fetchAllUsers, fetchAllStaff } = require("../controllers/users/get")
const {Error400Handler} = require("../errorHandling/errorHandlers")
const authenticate = require("../middleWare/authenticateRequests")
const { updateUserRole, updateDepartment } = require("../controllers/users/update")

router.get("/endusers", authenticate, fetchAllEndUsers)
router.get("/all", authenticate, fetchAllUsers)
router.get("/staff/all", authenticate, fetchAllStaff)
router.put("/role/:id", authenticate, updateUserRole)
router.put("/department/:id", authenticate, updateDepartment)

module.exports = router