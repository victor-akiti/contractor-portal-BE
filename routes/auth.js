const { fetchCurrentAuthState } = require("../controllers/auth/currentAuthentication")
const { logContractorIn } = require("../controllers/auth/login")
const { sendPasswordResetLink } = require("../controllers/auth/passwordReset")
const { validateRegistrationHash, registerNewAccount } = require("../controllers/auth/register")
const authenticate = require("../middleWare/authenticateRequests")

const Router = require("express").Router()

Router.get("/register/validate/:hash", validateRegistrationHash)
Router.post("/register", registerNewAccount)
Router.post("/login", logContractorIn)
Router.post("/password/reset", sendPasswordResetLink)
Router.get("/current-auth-state", authenticate, fetchCurrentAuthState)

module.exports = Router