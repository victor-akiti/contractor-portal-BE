const router = require("express").Router()
const { addJobCategory } = require("../controllers/jobCategories/add")
const { deleteJobCategory } = require("../controllers/jobCategories/delete")
const { getAllJobCategories } = require("../controllers/jobCategories/get")
const { updateJobCategory } = require("../controllers/jobCategories/update")
const {Error400Handler} = require("../errorHandling/errorHandlers")
const authenticate = require("../middleWare/authenticateRequests")

router.get("/", authenticate, getAllJobCategories)
router.post("/", authenticate, addJobCategory)
router.put("/:id", authenticate, updateJobCategory)
router.delete("/:id", authenticate, deleteJobCategory)


module.exports = router