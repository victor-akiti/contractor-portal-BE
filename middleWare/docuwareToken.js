let docuwareToken = ""
let expiryTime = 0
const axios = require("axios");

const addDocuwareToken = async (req, res, next) => {
    if (!docuwareToken) {
        //Request a new token and pass it to the controller
        const fetchedToken = await fetchDocuwareToken()

        console.log({docuwareToken});
        if (fetchedToken.status === 200 && fetchedToken?.data?.access_token) {
            let currentTime = Date.now()
            
            expiryTime = currentTime + fetchedToken?.data?.expires_in
            docuwareToken = fetchedToken?.data?.access_token
            req.docuwareToken = fetchedToken?.data?.access_token
        }
    } else {
        //Authenticate existing token. If token is stil valid, pass it to controller, else fetch a new token
        let currentTime = Date.now()
        if (expiryTime < currentTime ) {
            const fetchedToken = await fetchDocuwareToken()

            console.log({docuwareToken});
            if (docuwareToken.status === 200 && fetchedToken?.data?.access_token) {
                let currentTime = Date.now()
                
                expiryTime = currentTime + fetchedToken?.data?.expires_in
                docuwareToken = fetchedToken?.data?.access_token
                req.docuwareToken = fetchedToken?.data?.access_token
            }
        } else {
            req.docuwareToken = docuwareToken
        }
    }

    next() 
}

const fetchDocuwareToken = () => {
    return new Promise(async (resolve, reject) => {

        // Get required authentication token for communicating with docuware
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

          console.log({quote4});

          if (quote4) {
            resolve(quote4)
          } else {
            reject(null)
          }

    })
}

module.exports = {addDocuwareToken}