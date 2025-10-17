const { uploadFiles } = require("../controllers/files/upload")
const authenticate = require("../middleWare/authenticateRequests")
const multer = require("multer")
const upload = multer({
    dest:  __dirname+  "uploads", 
    limits: { fileSize: 25 * 1024 * 1024 },
})

const Router = require("express").Router()

Router.post("/upload", authenticate, upload.array("file"), uploadFiles)

module.exports = Router