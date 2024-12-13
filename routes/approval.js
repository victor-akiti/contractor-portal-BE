const Router = require("express").Router()
const { recommendApplicationForHold, approveApplicationForHold, revertFromHold, cancelHoldRequest, placeDirectlyOnHold } = require("../controllers/approvals/hold")
const { processApplicationToNextStage, processApplicationToL3, revertApplicationToL2, revertApplicationToPreviousStage, saveExposedPerson, removeExposedPerson } = require("../controllers/approvals/process")
const { returnApplicationToVendor, returnApplicationToPreviousStage, retrieveApplication } = require("../controllers/approvals/returns")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")
const { validateVendor } = require("../middleWare/validateVendor")

//Process routes
Router.post("/process/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), processApplicationToNextStage)
Router.post("/approve", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), processApplicationToL3)
Router.post("/revert/l2/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), validateVendor, revertApplicationToL2)
Router.post("/revert/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), revertApplicationToPreviousStage)
Router.post("/exposed-person/save/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), saveExposedPerson)
Router.post("/exposed-person/remove/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), removeExposedPerson)

//Hold routes
Router.post("/hold/recommend/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), recommendApplicationForHold)
Router.post("/hold/direct/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), placeDirectlyOnHold)
Router.get("/hold/approve/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), approveApplicationForHold)
Router.get("/hold/cancel/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), cancelHoldRequest)
Router.post("/hold/reject", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), processApplicationToL3)
Router.post("/hold/L2/revert", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), revertFromHold)

//Return routes
Router.post("/return/previous-stage/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), returnApplicationToPreviousStage)
Router.post("/return/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), returnApplicationToVendor)

//Retrieve routes
Router.post("/retrieve/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD", "IT Admin"]), retrieveApplication)


module.exports = Router