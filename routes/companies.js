const { updateCertificate } = require("../controllers/companies/certificates")
const { createVendor, updateVendor } = require("../controllers/companies/createAndUpdateVendor")
const { fetchAllCompanies, findCompanyByString, fetchCompanyCurrentRegistrationStatus, fetchAllApprovalData, fetchDashboardData, fetchRegistrationForm, fetchVendorRegistrationForm, fetchVendorApprovalData } = require("../controllers/companies/get")
const { submitApplication } = require("../controllers/companies/submitApplication")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")


const Router = require("express").Router()

Router.get("/all", authenticate, fetchAllCompanies)
Router.post("/find", authenticate, findCompanyByString)
Router.post("/registrationstatus/get", authenticate, fetchCompanyCurrentRegistrationStatus)
Router.get("/approvals/all", authenticate, checkIfUserHasPermissions(["Admin", "CO", "End User", "GMD", "GM", "HOD"]), fetchAllApprovalData)
Router.get("/dashboard/data", authenticate, fetchDashboardData)
Router.get("/register/form/:id", authenticate, fetchVendorRegistrationForm)
Router.get("/approval-data/:id", authenticate, fetchVendorApprovalData)
Router.get("/register/form", authenticate, fetchRegistrationForm)
Router.post("/vendor/create", authenticate, checkIfUserHasPermissions(["User"]), createVendor)
Router.put("/vendor/update", authenticate, checkIfUserHasPermissions(["User"]), updateVendor)
Router.put("/vendor/submit", authenticate, checkIfUserHasPermissions(["User"]), submitApplication)
Router.put("/certificates/:certificateID", authenticate, checkIfUserHasPermissions(["User"]), updateCertificate)

module.exports = Router
