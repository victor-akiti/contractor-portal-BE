const { createNewInvite, archiveInvite, getInvite, resendInvite, sendInviteReminder, renewInvite } = require("../controllers/companies/invite")
const { findInvitedCompany } = require("../controllers/migrations/invites")
const authenticate = require("../middleWare/authenticateRequests")
const { checkIfUserHasPermissions } = require("../middleWare/roleFilters")


const Router = require("express").Router()


Router.post("/find", authenticate, findInvitedCompany)
Router.post("/new", authenticate, createNewInvite)
Router.post("/resend", authenticate, resendInvite)
Router.post("/archive", authenticate, archiveInvite)
Router.get("/remind/:id", authenticate, checkIfUserHasPermissions(["Admin", "CO", "HOD"]), sendInviteReminder)
Router.get("/invite/:id", authenticate, checkIfUserHasPermissions(["Admin", "CO", "HOD"]), getInvite)
Router.get("/renew/:id", authenticate, checkIfUserHasPermissions(["Admin", "CO", "HOD"]), renewInvite)

module.exports = Router
