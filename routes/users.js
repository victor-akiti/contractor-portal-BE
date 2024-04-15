const router = require("express").Router()
const { fetchAllEndUsers, fetchAllUsers } = require("../controllers/users/get")
const {Error400Handler} = require("../errorHandling/errorHandlers")
const authenticate = require("../middleWare/authenticateRequests")

router.get("/endusers", authenticate, fetchAllEndUsers)
router.get("/all", authenticate, fetchAllUsers)

module.exports = router