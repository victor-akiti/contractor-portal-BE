const { sendBasicResponse } = require("../../helpers/response")
const { FormModel } = require("../../models/form")

exports.updateForm = async (req, res, next) => {
    try {

        const {id} = req.params
        const body = req.body
        const user = req.user

        //Confirm that form exists
        const form = await FormModel.findOne({_id: id})

        if (form) {
            //Update form

            const date = new Date()

            const formUpdate = {
                form: body,
                modificationHistory: [...form.modificationHistory, {
                    date: date,
                    updatedBy: user
                }]
            }

            const updatedForm = await FormModel.findOneAndUpdate ({_id: id}, formUpdate)

            if (updatedForm) {
                sendBasicResponse(res, updatedForm)
            }

            console.log({updatedForm});
        }

        console.log({form});

    } catch (error) {
        next(error)
    }
}