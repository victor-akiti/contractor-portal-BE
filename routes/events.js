const router = require("express").Router()
const authenticate = require("../middleWare/authenticateRequests")
const { fetchAllEvents } = require("../controllers/events/get")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")

router.get("/all", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin", "Supervisor"]), fetchAllEvents)


module.exports = router