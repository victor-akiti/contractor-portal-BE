const Router = require("express").Router()
const { recommendApplicationForHold, approveApplicationForHold, revertFromHold, cancelHoldRequest } = require("../controllers/approvals/hold")
const { processApplicationToNextStage, processApplicationToL3, revertApplicationToL2, revertApplicationToPreviousStage } = require("../controllers/approvals/process")
const { returnApplicationToVendor } = require("../controllers/approvals/returns")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")

//Process routes
Router.post("/process/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), processApplicationToNextStage)
Router.post("/approve", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), processApplicationToL3)
Router.post("/L3/revert", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), revertApplicationToL2)
Router.post("/revert", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), revertApplicationToPreviousStage)

//Hold routes
Router.post("/hold/recommend/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), recommendApplicationForHold)
Router.get("/hold/approve/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), approveApplicationForHold)
Router.get("/hold/cancel/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), cancelHoldRequest)
Router.post("/hold/reject", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), processApplicationToL3)
Router.post("/hold/L2/revert", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), revertFromHold)

//Return routes
Router.post("/return/:vendorID", authenticate, checkIfUserHasPermissions(["Admin", "HOD"]), returnApplicationToVendor)

module.exports = Router