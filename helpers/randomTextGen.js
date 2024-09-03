const importRandomStringGen = () => {
    return import("crypto-random-string").then(async result => {
        result.cryptoRandomStringAsync
        const {cryptoRandomStringAsync} = result
        const randomString = await cryptoRandomStringAsync({length: 15, type: "url-safe"})
        return randomString
    })
}

module.exports = {
  importRandomStringGen
}