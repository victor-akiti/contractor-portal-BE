const { updateCertificate } = require("../controllers/companies/certificates")
const { createVendor, updateVendor } = require("../controllers/companies/createAndUpdateVendor")
const { replaceEndUser, addEndUser, removeEndUser } = require("../controllers/companies/endUsers")
const { fetchAllCompanies, findCompanyByString, fetchCompanyCurrentRegistrationStatus, fetchAllApprovalData, fetchDashboardData, fetchRegistrationForm, fetchVendorRegistrationForm, fetchVendorApprovalData, fetchApprovalCounts, fetchApprovalsByTab, fetchInvites, searchVendors } = require("../controllers/companies/get")
const { makeVendorInactive } = require("../controllers/companies/inactive")
const { getAllSettings, updatePortalAdministratorProfile, requestNewPortalAdministrator } = require("../controllers/companies/settings")
const { submitApplication } = require("../controllers/companies/submitApplication")
const { updateCompanyJobCategoriesList } = require("../controllers/companies/update")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")


const Router = require("express").Router()

Router.get("/all", authenticate, fetchAllCompanies)
Router.post("/find", authenticate, findCompanyByString)
Router.post("/registrationstatus/get", authenticate, fetchCompanyCurrentRegistrationStatus)
Router.get("/approvals/all", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin", "Supervisor", "C and P Staff", "Executive Approver", "C&P Admin"]), fetchAllApprovalData);

// New optimized Approval routes
Router.get("/approvals/counts", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin", "Supervisor", "C and P Staff", "Executive Approver", "C&P Admin"]), fetchApprovalCounts)
Router.get("/approvals/:tab", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin", "Supervisor", "C and P Staff", "Executive Approver", "C&P Admin"]), fetchApprovalsByTab)
Router.get("/invites", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin", "Supervisor", "C and P Staff", "Executive Approver", "C&P Admin"]), fetchInvites)
Router.get("/search", authenticate, checkIfUserHasPermissions(["Admin", "VRM", "CO", "Amni Staff", "GMD", "GM", "HOD", "IT Admin", "Supervisor", "C and P Staff", "Executive Approver", "C&P Admin"]), searchVendors);


Router.get("/dashboard/data", authenticate, fetchDashboardData)
Router.get("/register/form/:id", authenticate, fetchVendorRegistrationForm)
Router.get("/approval-data/:id", authenticate, fetchVendorApprovalData)
Router.get("/register/form", authenticate, fetchRegistrationForm)
Router.get("/vendor/make-inactive/:companyID", authenticate, checkIfUserHasPermissions(["HOD", "IT Admin", "Admin"]), makeVendorInactive)
Router.post("/vendor/create", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin", "Admin"]), createVendor)
Router.put("/vendor/update", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin", "Admin"]), updateVendor)
Router.put("/vendor/submit", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin", "Admin"]), submitApplication)
Router.put("/certificates/:certificateID", authenticate, checkIfUserHasPermissions(["Vendor", "IT Admin", "Admin"]), updateCertificate)
Router.put("/job-categories/:id", authenticate, updateCompanyJobCategoriesList)

//Company settings and portal admin routes
Router.get("/settings/:vendorID", authenticate, checkIfUserHasPermissions(["Vendor", "Admin", "IT Admin"]), getAllSettings)
Router.put("/portal-admin/update/:vendorID", authenticate, checkIfUserHasPermissions(["Vendor", "Admin", "IT Admin"]), updatePortalAdministratorProfile)
Router.post("/portal-admin/replace/:vendorID", authenticate, checkIfUserHasPermissions(["Vendor", "Admin", "IT Admin"]), requestNewPortalAdministrator)

//End user management routes
Router.put("/vendor/end-users/:companyID", authenticate, checkIfUserHasPermissions(["IT Admin", "Admin", "HOD", "C&P Admin"]), replaceEndUser)
Router.post("/vendor/end-users/:companyID", authenticate, checkIfUserHasPermissions(["IT Admin", "Admin", "HOD", "C&P Admin"]), addEndUser)
Router.post("/vendor/end-users/remove/:companyID", authenticate, checkIfUserHasPermissions(["IT Admin", "Admin", "HOD", "C&P Admin"]), removeEndUser)

module.exports = Router
