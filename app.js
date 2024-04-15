const express = require("express")
const app = express()
require("dotenv").config()
const returnError = require("./errorHandling/returnError")
const defaultRouter = require("./routes/default")
const formsRouter = require("./routes/forms")
const userRouter = require("./routes/user")
const usersRouter = require("./routes/users")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")

mongoose.connect(process.env.MONGO_CONNECT_URL).then(response => {
    console.log("Successfully connected to MongoDB Atlas");
}).catch(error => {
    console.log({error});
})

app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["token","Content-Type"],
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use("/", defaultRouter)
app.use("/forms", formsRouter)
app.use("/user", userRouter)
app.use("/users", usersRouter)

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
})

app.use(returnError)