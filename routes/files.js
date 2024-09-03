const { uploadFiles } = require("../controllers/files/upload")
const authenticate = require("../middleWare/authenticateRequests")
const multer = require("multer")
const upload = multer({dest: "/uploads"})

const Router = require("express").Router()

Router.post("/upload", authenticate, upload.array("file"), uploadFiles)

module.exports = Router