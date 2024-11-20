const router = require("express").Router()
const authenticate = require("../middleWare/authenticateRequests")
const { fetchAllEvents } = require("../controllers/events/get")

router.get("/all", authenticate, fetchAllEvents)


module.exports = router