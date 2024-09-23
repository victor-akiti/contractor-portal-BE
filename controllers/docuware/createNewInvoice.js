const { default: mongoose } = require("mongoose");
const { Error404Handler, Error400Handler, Error500Handler, Error403Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { InvoiceFormModel } = require("../../models/invoice");
const { InvoiceRecordModel } = require("../../models/invoiceRecord");
const { cloudinary } = require("../../helpers/cloudinary");
const axios = require("axios");

exports.createNewInvoice = async (req, res, next) => {
    try {
        //Fetch invoice record
        // console.log(req.body);
        // return sendBasicResponse(res, {completionID: "12345"})

        const invoiceRecord = await InvoiceFormModel.findOne({_id: req.body._id})

        if (!invoiceRecord) {
            throw new Error404Handler("This invoice was not found.")
        }

        console.log({body: req.body});

        

        const currentDate = new Date()
        console.log({currentDate: String(currentDate.toLocaleString("en-NG")).replace(",", "").slice(0, 16)});



        //Validate supplied details
        const {CONTRACTOR_EMAIL, TIN, INVOICED_AMOUNT, INVOICE_NUMBER, PAYMENT_OPTION, MILESTONE, INVOICE_DATE, CALL_OFF_NUMBER} = req.body

        let docuwareInvoiceBody = []

        if (!CONTRACTOR_EMAIL) {
            throw new Error400Handler("Please provide your email address")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "CONTRACTOR_EMAIL_",
                Item: CONTRACTOR_EMAIL,
              })
        }

        if (!INVOICE_NUMBER) {
            throw new Error400Handler("Please supply your invoice number")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "DOCUMENT_NUMBER",
                Item: INVOICE_NUMBER,
            })
        }

        if (!INVOICED_AMOUNT) {
            throw new Error400Handler("Please enter the amount you're invoicing for")
        } else {
            docuwareInvoiceBody.push({
                FieldName: "AMOUNT",
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
        } else {
            const newInoiceDate = new Date(req.body.INVOICE_DATE)
            docuwareInvoiceBody.push({
                FieldName: "DATE",
                Item: newInoiceDate.toLocaleDateString("en-US"),
            })
        }

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

        const invoicedAmounts = await InvoiceRecordModel.find({INVOICE_FORM_ID: new mongoose.Types.ObjectId(invoiceRecord._id)})

        for (let index = 0; index < invoicedAmounts.length; index++) {
            const element = invoicedAmounts[index];

            totalInvoicedAmount = totalInvoicedAmount + element.INVOICE_AMOUNT
            
        }

        //Check if invoice with that number has been submitted
        const invoiceAlreadySubmitted = await InvoiceRecordModel.findOne({INVOICE_NUMBER})

        if (invoiceAlreadySubmitted) {
            throw new Error403Handler("An invoice with this invoice number has beeen submitted.")
        }

        console.log({totalInvoicedAmount, invoiceDAMount: INVOICED_AMOUNT, contractValue: invoiceRecord.CONTRACT_VALUE, CALL_OFF_NUMBER});

        if ((totalInvoicedAmount + Number(INVOICED_AMOUNT)) > invoiceRecord.CONTRACT_VALUE) {
            throw new Error400Handler("The total amounts you have invoiced is greater than the invoice value")
        }

        console.log({name: invoiceRecord.CONTRACTOR_NAME, department: invoiceRecord.DEPARTMENT, title: invoiceRecord.DOCUMENT_TITLE, entity: invoiceRecord.AMNI_ENTITY, currency: invoiceRecord.CURRENCY});

        docuwareInvoiceBody.push({
            FieldName: "CALL_OFF_NUMBER",
            Item: CALL_OFF_NUMBER ? CALL_OFF_NUMBER : ""
        })

        // Add fields from invoice record
        docuwareInvoiceBody.push({
            FieldName: "DOCUMENT_TYPE",
            Item: "Contractor Form",
        })

        docuwareInvoiceBody.push({
            FieldName: "UNIQUE_CODE",
            Item: invoiceRecord.INVOICE_CODE,
        })

        docuwareInvoiceBody.push({
            FieldName: "COMPANY_NAME",
            Item: invoiceRecord.CONTRACTOR_NAME,
        })

        docuwareInvoiceBody.push({
            FieldName: "DUE_STATUS",
            Item: "Payment Not Due",
        })

        docuwareInvoiceBody.push({
            FieldName: "SUBMISSION_DATE",
            Item: String(currentDate.toLocaleString("en-US", {month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false})).replace(",", "").slice(0, 16),
        })
        

        docuwareInvoiceBody.push({
            FieldName: "MARKUP_APPLICABLE",
            Item: invoiceRecord.MARKUP_APPLICABLE ? "Yes" : "No",
        })

        if (invoiceRecord.MARKUP_APPLICABLE) {
            docuwareInvoiceBody.push({
                FieldName: "MARKUP",
                Item: invoiceRecord.MARKUP,
            })
        }

        docuwareInvoiceBody.push({
            FieldName: "SERVICED_DEPARTMENT",
            Item: invoiceRecord.DEPARTMENT,
        })

        docuwareInvoiceBody.push({
            FieldName: "CONTRACT_TITLE",
            Item: invoiceRecord.DOCUMENT_TITLE,
        })

        docuwareInvoiceBody.push({
            FieldName: "SELECTED_COMPANY",
            Item: invoiceRecord.AMNI_ENTITY === "Amni International" ? "Amni International Petroleum" : invoiceRecord.AMNI_ENTITY,
        })

        docuwareInvoiceBody.push({
            FieldName: "PO_CALL_OFF_NUMBER",
            Item: invoiceRecord.DOCUMENT_NUMBER,
        })

        docuwareInvoiceBody.push({
            FieldName: "CURRENCY",
            Item: invoiceRecord.CURRENCY,
        })

        docuwareInvoiceBody.push({
            FieldName: "STATUS",
            Item: "Submitted",
        })

        //Push invoice to docuware
        

        // Get required authentication token for communicating with docuware
        // const quote = await axios({
        //     method: "GET",
        //     url: `https://amni.docuware.cloud/DocuWare/Platform/Home/IdentityServiceInfo`,
        //   });
      
        //   const identityServiceUrl = quote.data.IdentityServiceUrl;
      
        //   const quote2 = await axios({
        //     method: "GET",
        //     url: identityServiceUrl + "/" + ".well-known/openid-configuration",
        //   });
      
        //   console.log({identityServiceUrl, quote2});
      
        //   const body = new URLSearchParams();
        //   body.append("grant_type", "password");
        //   body.append("scope", "docuware.platform");
        //   body.append("client_id", "docuware.platform.net.client");
        //   body.append("username", "Godson Aniagudo");
        //   body.append("password", "TheAppDev24!");
      
        //   const quote4 = await axios.post(
        //     identityServiceUrl + "/" + "connect/token",
        //     body
        //   );

        //   console.log({quote4});

          

          

          fetch(
            "https://amni.docuware.cloud/DocuWare/Platform/FileCabinets/ecbd2b98-4d02-46a4-a923-9e9464a487c1/Documents",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${req.docuwareToken}`,
                "Content-Type": "application/json",
                Accept: "*/*",
              },
              body: JSON.stringify({
                Fields: docuwareInvoiceBody,
              }),
            }
          ).then(async result => {
            const string = await result.text();
            console.log({string});
            // const json = string === "" ? {} : JSON.parse(string);
            // console.log({json});
            // return json;
            const parseString = require("xml2js").parseString
            var xml = string
            parseString(xml, async function (err, result) {
                let invoiceRecordCopy = {...invoiceRecord}
                delete invoiceRecordCopy["_id"]

                const newInvoice = new InvoiceRecordModel({...invoiceRecordCopy, CONTRACTOR_EMAIL, TIN, INVOICE_NUMBER, PAYMENT_OPTION, INVOICE_DATE, INVOICE_AMOUNT: INVOICED_AMOUNT, MILESTONE, INVOICE_FORM_ID: invoiceRecord._id, INVOICE_ID: result.Document["$"].Id})

                const savedNewInvoice = await newInvoice.save()

                console.log({savedNewInvoice});

                sendBasicResponse(res, {completionID: result.Document["$"].Id})
            })

            

          }).catch(error => {
            console.log({error});
          })

          return

          console.log({savedInvoice: savedInvoice.status, body: savedInvoice.body});
          const fullSavedInvoice = await savedInvoice.json()
          savedInvoice.text()
          console.log({fullSavedInvoice});

          if (savedInvoice.status === 200) {
            // Update invoice record
            let invoiceRecordCopy = {...invoiceRecord}
            delete invoiceRecordCopy["_id"]
            const newInvoice = new InvoiceRecordModel({CONTRACTOR_EMAIL, TIN, INVOICE_NUMBER, PAYMENT_OPTION, INVOICE_DATE, INVOICE_AMOUNT: INVOICED_AMOUNT, MILESTONE, INVOICE_FORM_ID: invoiceRecord._id})

            const savedNewInvoice = await newInvoice.save()

            sendBasicResponse(res, {})

            console.log({updatedInvoiceRecord});
          } else {
            throw new Error500Handler("Could not save invoice. Please try again later.")
          }

          return
        

        // Return saved invoice ID for uploading documents
    } catch (error) {
        console.log({theError: error.response});
        next(error)
    }
}

exports.attachFilesToNewInvoice = async (req, res, next) => {
    try {
        //Get document ID
        const {documentID} = req.params

        console.log({documentID});


        console.log({docuwareToken: req.docuwareToken});

        //Get files
        const files = req.files
        const {Blob} = require("buffer")

        console.log({files});

        if (!documentID) {
            throw new Error400Handler("A document ID is required to complete this request")
        }

        if (files && files.length === 0) {
            throw new Error400Handler("Select the files you would like to attach to your invoice")
        }
        

        // let FormData = require("form-data")
        

        // for (let index = 0; index < files.length; index++) {
        //     const element = files[index];
        //     formData.append("File", element)
        // }
        

        //Read file data and create blob from it. Create buffer from the blob and then append it to the FormData that would be uploaded to docuware.
        

        for (let index = 0; index < files.length; index++) {
            let formData = new FormData()
            const fs = require("fs")
            const element = files[index];

            const fileData = fs.readFileSync(element.path)
            let blob = new Blob([fileData],{type: element.mimetype})
            let data = fs.createReadStream(element.path,'utf8')
            let uploadError = false
    
            const buf = await blob.arrayBuffer()



            formData.append("File[]", blob, element.originalname)

            axios.post(`https://amni.docuware.cloud/DocuWare/Platform/FileCabinets/ecbd2b98-4d02-46a4-a923-9e9464a487c1/Documents/${documentID}`, formData, {
                headers: {
                    Authorization: `Bearer ${req.docuwareToken}`,
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
                }
            }).then((responseFromServer2) => {
                
                if (index === files.length - 1) {
                    sendBasicResponse(res, {})
                }
            }).catch((err) => {
                console.log({err});
                uploadError = true
                res.status(500).send({status: "Failed", message: "An error occurred while submitting your invoice. Please contact the site administrator."})
            })

            if (uploadError) {
                break
            }
            
        }

        // formData.getLength(result => {
        //     console.log({result});
        // })

        //Make fetch request to upload file to Docuware


        //   console.log({upladFileRequest});

        

        return



        fetch(
            `https://amni.docuware.cloud/DocuWare/Platform/FileCabinets/325e2e73-e1dd-4abe-b550-88802f8cf5bd/Documents/3697`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkVBODgzNTEyODE4OTFEQzU5RUVGQ0ZBQjcxMEQ5REY4NDgxNDdFMjQiLCJ4NXQiOiI2b2cxRW9HSkhjV2U3OC1yY1EyZC1FZ1VmaVEiLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2xvZ2luLWVtZWEuZG9jdXdhcmUuY2xvdWQvY2M2MzQ0YzctZTRiOS00NWQ1LTk0ODItZWUyZDc5NmRlNDY0IiwibmJmIjoxNzI0MjQxNzI5LCJpYXQiOjE3MjQyNDE3MjksImV4cCI6MTcyNDI0NTMyOSwiYXVkIjoiZG9jdXdhcmUucGxhdGZvcm0iLCJzY29wZSI6WyJkb2N1d2FyZS5wbGF0Zm9ybSJdLCJhbXIiOlsicGFzc3dvcmQiXSwiY2xpZW50X2lkIjoiZG9jdXdhcmUucGxhdGZvcm0ubmV0LmNsaWVudCIsInN1YiI6ImQ3ZjdiOTY2LTA5M2EtNGUxYi05NzE5LTU1MzI3OWU5MTMyMSIsImF1dGhfdGltZSI6MTcyNDI0MTcyOSwiaWRwIjoibG9jYWwiLCJ1c2VybmFtZSI6IkdvZHNvbiBBbmlhZ3VkbyIsInVzZXJfZW1haWwiOiJnb2Rzb24uYW5pYWd1ZG9AYW1uaS5jb20iLCJvcmdhbml6YXRpb24iOiJBbW5pIEludGVybmF0aW9uYWwgUGV0cm9sZXVtIERldmVsb3BtZW50IENvLiIsIm9yZ19ndWlkIjoiY2M2MzQ0YzctZTRiOS00NWQ1LTk0ODItZWUyZDc5NmRlNDY0IiwiaG9zdF9pZCI6IlVuZGVmaW5lZCIsInByb2R1Y3RfdHlwZSI6IlBsYXRmb3JtU2VydmljZSJ9.mu1KKvyShjJg51ry58xv7qpvNXYVI11OR0Dp0u2ip7ijMjyCyYGBKd9_I64lu3Y2ULmbU8PIu8ym-RlVWf3On_9uBgOn5NtS5wAmwg7bTEvYFNF7LA0JoPqxab37v7oOT7o0YuWtTwckQs19jRL3wbO7riZ58nd82g82tsZ6fhDkTM-428f3TIvn6rGXY50cI5rYlwG6r8V2zQz-Y2EBtwyry4irduaKebljQbyYCKyD3IFyKIDpzv05_JMh91d_UAMynLoV85O2Ehhb-0iDuXaA1OkO-v-3MPnvcYOEjN4O2VKoKSY3lgGVEixxh9UT5ghuJw5al7NaKJ3VGzztUA`,
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
              },
              body: formData,

            }
          ).then(async result => {
            console.log({result});
            const string = await result.text();
            // console.log({string});
            // const json = string === "" ? {} : JSON.parse(string);
            // console.log({json});
            // return json;
            const parseString = require("xml2js").parseString
            var xml = string
            parseString(xml, function (err, result) {
                console.dir({result, err});
            })

            sendBasicResponse(res)

            // sendBasicResponse(res, {completionID: result.Document["$"].Id})

          }).catch(error => {
            console.log({error});
          })
        
    } catch (error) {
        next(error)
    }
}