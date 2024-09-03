const express = require("express")
const app = express()
require("dotenv").config()
const returnError = require("./errorHandling/returnError")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const SmeeClient = require("smee-client")

//Declare routers
const defaultRouter = require("./routes/default")
const formsRouter = require("./routes/forms")
const userRouter = require("./routes/user")
const usersRouter = require("./routes/users")
const companiesRouter = require("./routes/companies")
const migrationsRouter = require("./routes/migrations")
const invitesRouter = require("./routes/invite")
const authRouter = require("./routes/auth")
const filesRouter = require("./routes/files")
const docuwareRouter = require("./routes/docuware")

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

//Apply Routes
app.use("/", defaultRouter)
app.use("/forms", formsRouter)
app.use("/user", userRouter)
app.use("/users", usersRouter)
app.use("/companies", companiesRouter)
app.use("/migrations", migrationsRouter)
app.use("/invites", invitesRouter)
app.use("/auth", authRouter)
app.use("/files", filesRouter)
app.use("/docuware", docuwareRouter)

const smee = new SmeeClient({
    source: 'https://smee.io/bRrz1sAx2t9nAwe',
    target: 'http://localhost:8080/docuware/createInvoiceRecord',
    logger: console
})

const events = smee.start()


app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
})

app.use(returnError)