const router = require("express").Router()
const {Error400Handler} = require("../errorHandling/errorHandlers")

router.get("/", (req, res) => {
    throw new Error400Handler("Testing error handling")
    res.status(200).send("Server up")
})

module.exports = router