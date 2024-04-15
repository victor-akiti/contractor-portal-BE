const sendBasicResponse = (res, body) => {
    res.status(200).send({status: "OK", data: body})
}

module.exports = {
    sendBasicResponse
}