exports.setCookies = async (req, res, next) => {
    console.log("setting cookies");
    
    const authToken = req.headers["token"]

    console.log({authToken});

    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
    res.setHeader('Access-Control-Allow-Credentials', "true")
    const jwt = require("jsonwebtoken")
    const token = jwt.sign(authToken, process.env.JWT_SECRET)

    console.log({token});

    res.cookie("authToken", authToken, {
        httpOnly: true
    })


    res.status(200).send({status: "OK"})
    
}