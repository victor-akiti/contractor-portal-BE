
const { migrateCompanies } = require("../controllers/migrations/companies")
const { migrateNewRequests } = require("../controllers/migrations/invites")
const { migrateRegistrationRequests } = require("../controllers/migrations/newInvites")
const { migrateUsers } = require("../controllers/migrations/users")
const authenticate = require("../middleWare/authenticateRequests")


const Router = require("express").Router()

// Router.get("/registrationRequests", authenticate, migrateRegistrationRequests)
// Router.get("/newRequests", authenticate, migrateNewRequests)
// Router.get("/companies", authenticate, migrateCompanies)
// Router.get("/users", migrateUsers)

module.exports = Router
