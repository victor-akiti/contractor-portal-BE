const { Error404Handler, Error400Handler } = require("../../errorHandling/errorHandlers");
const { InvoiceFormModel } = require("../../models/invoice");

exports.createNewInvoice = async (req, res, next) => {
    try {
        //Fetch invoice record
        console.log(req.body);
        const invoiceRecord = await InvoiceFormModel.findOne({_id: req.body._id})

        if (!invoiceRecord) {
            throw new Error404Handler("This invoice was not found.")
        }

        console.log({invoiceRecordFetched: invoiceRecord});

        //Validate supplied details
        const {CONTRACTOR_EMAIL, TIN, INVOICED_AMOUNT, INVOICE_NUMBER, PAYMENT_OPTION, MILESTONE, INVOICE_DATE} = req.body

        let docuwareInvoiceBody = []

        if (!CONTRACTOR_EMAIL) {
            throw new Error400Handler("Please provide your email address")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "CONTRACTOR_EMAIL",
                Item: CONTRACTOR_EMAIL,
              })
        }

        if (!INVOICE_NUMBER) {
            throw new Error400Handler("Please supply your invoice number")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "INVOICE_NUMBER",
                Item: INVOICE_NUMBER,
            })
        }

        if (!INVOICED_AMOUNT) {
            throw new Error400Handler("Please enter the amount you're invoicing for")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "INVOICE_AMOUNT",
                Item: INVOICED_AMOUNT,
            })
        }

        if (!TIN) {
            throw new Error400Handler("Please enter your tax identification number")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "TIN",
                Item: TIN,
            })
        }

        if (!INVOICE_DATE) {
            throw new Error400Handler("Please enter your invoice date")
        } 
        // else {
        //     docuwareInvoiceBody.push({
        //         FieldName: "DATE",
        //         Item: INVOICE_DATE,
        //     })
        // }

        if (!PAYMENT_OPTION) {
            throw new Error400Handler("Please select a payment option")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "PAYMENT_OPTION",
                Item: PAYMENT_OPTION,
            })
        }

        if (PAYMENT_OPTION === "Milestone" && !MILESTONE) {
            throw new Error400Handler("Please enter the milestone/service completed")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "MILESTONE",
                Item: MILESTONE,
            })
        }

        if (INVOICED_AMOUNT > invoiceRecord.CONTRACT_VALUE) {
            throw new Error400Handler("The amount you entered is greater than the contract value")
        }

        let totalInvoicedAmount = 0

        for (let index = 0; index < invoiceRecord.INVOICED_AMOUNTS.length; index++) {
            const element = invoiceRecord.INVOICED_AMOUNTS[index];

            totalInvoicedAmount = totalInvoicedAmount + element.amount
            
        }

        if ((totalInvoicedAmount + INVOICED_AMOUNT) > invoiceRecord.CONTRACT_VALUE) {
            throw new Error400Handler("The total amounts you have invoiced is greater than the invoice value")
        }

        //Add fields from invoice record
        // docuwareInvoiceBody.push({
        //     FieldName: "DOCUMENT_TYPE",
        //     Item: "Invoice",
        // })

        // docuwareInvoiceBody.push({
        //     FieldName: "CONTRACTOR_NAME",
        //     Item: invoiceRecord.CONTRACTOR_NAME,
        // })

        // docuwareInvoiceBody.push({
        //     FieldName: "SERVICED_DEPARTMENT",
        //     Item: invoiceRecord.DEPARTMENT,
        // })

        // docuwareInvoiceBody.push({
        //     FieldName: "CONTRACT_TITLE",
        //     Item: invoiceRecord.DOCUMENT_TITLE,
        // })

        // docuwareInvoiceBody.push({
        //     FieldName: "SELECTED_COMPANY",
        //     Item: invoiceRecord.AMNI_ENTITY,
        // })

        // docuwareInvoiceBody.push({
        //     FieldName: "CURRENCY",
        //     Item: invoiceRecord.CURRENCY,
        // })

        //Push invoice to docuware
        const axios = require("axios");

        //Get required authentication token for communicating with docuware
        const quote = await axios({
            method: "GET",
            url: `https://amni.docuware.cloud/DocuWare/Platform/Home/IdentityServiceInfo`,
          });
      
          const identityServiceUrl = quote.data.IdentityServiceUrl;
      
          const quote2 = await axios({
            method: "GET",
            url: identityServiceUrl + "/" + ".well-known/openid-configuration",
          });
      
          console.log({identityServiceUrl, quote2});
      
          const body = new URLSearchParams();
          body.append("grant_type", "password");
          body.append("scope", "docuware.platform");
          body.append("client_id", "docuware.platform.net.client");
          body.append("username", "Godson Aniagudo");
          body.append("password", "TheAppDev24!");
      
          const quote4 = await axios.post(
            identityServiceUrl + "/" + "connect/token",
            body
          );

          

          

          const savedInvoice = await fetch(
            "https://amni.docuware.cloud/DocuWare/Platform/FileCabinets/325e2e73-e1dd-4abe-b550-88802f8cf5bd/Documents",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${quote4.data.access_token}`,
                "Content-Type": "application/json",
                Accept: "*/*",
              },
              body: JSON.stringify({
                Fields: docuwareInvoiceBody,
              }),
            }
          );

          console.log({savedInvoice});

          return
        //Update invoice record
        let invoiceRecordCopy = {...invoiceRecord}
        delete invoiceRecordCopy["_id"]
        const updatedInvoiceRecord = await InvoiceFormModel.findOneAndUpdate({_id: invoiceRecord._id}, {CONTRACTOR_EMAIL, TIN, INVOICE_NUMBER, PAYMENT_OPTION, INVOICE_DATE, $push: {INVOICED_AMOUNTS: {amount: INVOICED_AMOUNT}, MILESTONES: {milestone: MILESTONE}}})

        console.log({updatedInvoiceRecord});

        //Return saved invoice ID for uploading documents
    } catch (error) {
        next(error)
    }
}