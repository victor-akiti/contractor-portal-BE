const { updateCertificate } = require("../controllers/companies/certificates")
const { createVendor, updateVendor } = require("../controllers/companies/createAndUpdateVendor")
const { fetchAllCompanies, findCompanyByString, fetchCompanyCurrentRegistrationStatus, fetchAllApprovalData, fetchDashboardData, fetchRegistrationForm, fetchVendorRegistrationForm, fetchVendorApprovalData } = require("../controllers/companies/get")
const { getAllSettings, updatePortalAdministratorProfile, requestNewPortalAdministrator } = require("../controllers/companies/settings")
const { submitApplication } = require("../controllers/companies/submitApplication")
const { updateCompanyJobCategoriesList } = require("../controllers/companies/update")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")


const Router = require("express").Router()

Router.get("/all", authenticate, fetchAllCompanies)
Router.post("/find", authenticate, findCompanyByString)
Router.post("/registrationstatus/get", authenticate, fetchCompanyCurrentRegistrationStatus)
Router.get("/approvals/all", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin"]), fetchAllApprovalData)
Router.get("/dashboard/data", authenticate, fetchDashboardData)
Router.get("/register/form/:id", authenticate, fetchVendorRegistrationForm)
Router.get("/approval-data/:id", authenticate, fetchVendorApprovalData)
Router.get("/register/form", authenticate, fetchRegistrationForm)
Router.post("/vendor/create", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin"]), createVendor)
Router.put("/vendor/update", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin"]), updateVendor)
Router.put("/vendor/submit", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin"]), submitApplication)
Router.put("/certificates/:certificateID", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin"]), updateCertificate)
Router.put("/job-categories/:id", authenticate, updateCompanyJobCategoriesList)

//Company settings and portal admin routes
Router.get("/settings/:vendorID", authenticate, checkIfUserHasPermissions(["Vendor", "Admin", "IT Admin"]), getAllSettings)
Router.put("/portal-admin/update/:vendorID", authenticate, checkIfUserHasPermissions(["Vendor", "Admin", "IT Admin"]), updatePortalAdministratorProfile)
Router.post("/portal-admin/replace/:vendorID", authenticate, checkIfUserHasPermissions(["Vendor", "Admin", "IT Admin"]), requestNewPortalAdministrator)

module.exports = Router
