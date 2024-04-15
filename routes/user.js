const { setCookies } = require("../controllers/user/cookies")

const Router = require("express").Router()

//Named this endpoint ver for Verify. It receives the user's ID Token, creates a JWT out of it and stores it in a HTTP-only cookie for authenticating future requests. I decided to use a vague name so random people coming across the endpoint don't figure out what it's for
Router.put("/ver", setCookies)

module.exports = Router 