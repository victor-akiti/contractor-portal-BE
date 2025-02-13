const router = require("express").Router()
const { Router } = require("express")
const { fetchAllEndUsers, fetchAllUsers, fetchAllStaff, fetchAllCnPStaff } = require("../controllers/users/get")
const {Error400Handler} = require("../errorHandling/errorHandlers")
const authenticate = require("../middleWare/authenticateRequests")
const { updateUserRole, updateDepartment } = require("../controllers/users/update")
const { createEndUser } = require("../controllers/users/create")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")

router.get("/endusers", authenticate, fetchAllEndUsers)
router.get("/all", authenticate, fetchAllUsers)
router.get("/staff/all", authenticate, fetchAllStaff)
router.get("/cnpstaff/all", authenticate, fetchAllCnPStaff)
router.put("/role/:id", authenticate, updateUserRole)
router.put("/department/:id", authenticate, updateDepartment)
router.post("/enduser/create", authenticate, checkIfUserHasPermissions(["HOD", "IT Admin", "Admin"]), createEndUser)

module.exports = router