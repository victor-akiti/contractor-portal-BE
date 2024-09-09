const { Error400Handler, Error404Handler, Error500Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { FormModel } = require("../../models/form");

exports.deleteForm = async (req, res, next) => {
    try {
        console.log("deleting form");
        console.log(req.params);
        //Check if a form ID was supplied
        const {id} = req.params

        const formToDelete = await FormModel.findOne({_id: id})

        if (!id || !formToDelete) {
            if (!id) {
                throw new Error400Handler("You did not select a form to delete.")
            } else {
                throw new Error404Handler("Could not find the form you're trying to delete. It may have already been deleted.")
            }
        }

        //Delete form and return response
        const deletedForm = await FormModel.findOneAndDelete({_id: id})

        if (deletedForm) {
            sendBasicResponse(res, {})
        } else {
            throw new Error500Handler("An error occured and the form couldn't be deleted. Please try again later.")
        }
    } catch (error) {
        next(error)
    }
}