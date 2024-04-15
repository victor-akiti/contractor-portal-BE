const { Error404Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { FormModel } = require("../../models/form")

exports.getAllForms = async (req, res, next) => {
    try {
        const allForms = await FormModel.find()

        sendBasicResponse(res, allForms)

        console.log({allForms});
    } catch (error) {
        next(error)
    }
}

exports.getForm = async (req, res, next) => {
    try {
        console.log("Geting form");
        console.log({params: req.params});
        const {id} = req.params

        if (id) {
            const form = await FormModel.findOne({_id: id})

            if (form) {
                sendBasicResponse(res, form)
            } else {
                throw new Error404Handler("No form was found for this form ID")
            }

            console.log({form});
        } else {
            throw new Error400Handler("A form ID is required to fetch this form.")
        }
    } catch (error) {
        next(error)
    }
}