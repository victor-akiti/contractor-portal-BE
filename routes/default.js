const router = require("express").Router()
const {Error400Handler} = require("../errorHandling/errorHandlers")

router.get("/", (req, res) => {
    res.status(200).send("Server up")
})

module.exports = router