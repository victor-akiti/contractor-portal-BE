const { createInvoiceFormRecord } = require("../controllers/docuware/createInvoiceFormRecord")
const { createNewInvoice, attachFilesToNewInvoice } = require("../controllers/docuware/createNewInvoice")
const { fetchInvoiceDetails, fetchAllSubmittedInvoices, fetchAllInvoiceForms } = require("../controllers/docuware/getInvoiceDetails")
const multer = require("multer")
const authenticate = require("../middleWare/authenticateRequests")
const { addDocuwareToken } = require("../middleWare/docuwareToken")
const upload = multer({dest: "/uploads"})

const Router = require("express").Router()

Router.post("/createInvoiceRecord", createInvoiceFormRecord)
Router.get("/invoice/record/:invoiceCode", fetchInvoiceDetails)
Router.post("/invoice/new",addDocuwareToken, createNewInvoice)
Router.post("/invoice/attachFiles/:documentID", addDocuwareToken, upload.array("file"), attachFilesToNewInvoice)
Router.get("/invoice-forms/all", authenticate, fetchAllInvoiceForms)

module.exports = Router