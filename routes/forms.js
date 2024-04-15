const { getAllForms, getForm } = require("../controllers/forms/get")
const { createNewForm } = require("../controllers/forms/new")
const { updateForm } = require("../controllers/forms/update")
const authenticate = require("../middleWare/authenticateRequests")


const Router = require("express").Router()

Router.post("/new", authenticate, createNewForm)
Router.get("/all", authenticate, getAllForms)
Router.get("/form/:id", authenticate, getForm)
Router.put("/form/:id", authenticate, updateForm)

module.exports = Router
