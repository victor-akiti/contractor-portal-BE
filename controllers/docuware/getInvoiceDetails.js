const { default: mongoose } = require("mongoose");
const { Error400Handler, Error404Handler, Error403Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { InvoiceFormModel } = require("../../models/invoice");
const { InvoiceRecordModel } = require("../../models/invoiceRecord");

exports.fetchInvoiceDetails = async (req, res, next) => {
    try {
        console.log(req.params);
        const {invoiceCode} = req.params

        if (!invoiceCode) {
            throw new Error400Handler("You have to provide an invoice submission code")
        }

        //Find invoice record
        const invoiceRecord = await InvoiceFormModel.findOne({INVOICE_CODE: invoiceCode})

        let totalInvoicedAmount = 0

        const invoicedAmounts = await InvoiceRecordModel.find({INVOICE_FORM_ID: new mongoose.Types.ObjectId(invoiceRecord._id)})

        console.log({invoicedAmounts});

        for (let index = 0; index < invoicedAmounts.length; index++) {
            const element = invoicedAmounts[index];

            totalInvoicedAmount = totalInvoicedAmount + element.INVOICE_AMOUNT
            
        }

        if (totalInvoicedAmount >= invoiceRecord.CONTRACT_VALUE) {
            throw new Error400Handler("The amounts you have invoiced for this contract have matched or exceeded the contract value.")
        }

        if (invoiceRecord.isDisabled) {
            throw new Error403Handler("This invoice form has been disabled. Please contact the site administrator")
        }

        if (invoiceRecord) {
            let invoiceRecordCopy = {...invoiceRecord._doc}
            console.log({invoiceRecordCopy});
            if (invoiceRecordCopy.INVOICE_NUMBER) {
                delete invoiceRecordCopy["INVOICE_NUMBER"]
            }
            sendBasicResponse(res, invoiceRecordCopy)
        } else {
            throw new Error404Handler("Could not find this invoice record")
        }

        console.log({invoiceRecord});
    } catch (error) {
        next(error)
    }
}

exports.fetchAllSubmittedInvoices = async (req, res, next) => {
    try {
        console.log("Getting invoices");
    } catch (error) {
        next(error)
    }
}

exports.fetchAllInvoiceForms = async (req, res, next) => {
    try {
        console.log("Getting invoices");
        const invoiceForms = await InvoiceFormModel.find({})
        sendBasicResponse(res, invoiceForms)
    } catch (error) {
        next(error)
    }
}