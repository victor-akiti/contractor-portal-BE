const { generateUniqueCodes, generateUniqueCodesForVendors } = require("../controllers/forms/code")
const { deleteForm } = require("../controllers/forms/delete")
const { getAllForms, getForm } = require("../controllers/forms/get")
const { createNewForm, createDuplicateForm } = require("../controllers/forms/new")
const { updateForm } = require("../controllers/forms/update")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")


const Router = require("express").Router()

Router.post("/new", authenticate, createNewForm)
Router.post("/duplicate/:formID", authenticate, createDuplicateForm)
Router.get("/all", authenticate, getAllForms)
Router.get("/codes/generate/:id", authenticate, generateUniqueCodes)
Router.post("/vendors/codes/generate", authenticate, generateUniqueCodesForVendors)
Router.get("/form/:id", authenticate, getForm)
Router.put("/form/:id", authenticate, updateForm)
Router.delete("/form/:id", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), deleteForm)

module.exports = Router
