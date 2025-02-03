const { sendBasicResponse } = require("../../helpers/response")
const { EventModel } = require("../../models/events")

exports.fetchAllEvents = async (req, res, next) => {
    try {
        const events = await EventModel.find().populate("vendorID").populate("userID")

        sendBasicResponse(res, events.reverse())
    } catch (error) {
        next(error)
    }
}