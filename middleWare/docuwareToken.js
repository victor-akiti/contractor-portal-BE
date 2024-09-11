let docuwareToken = ""
let expiryTime = 0
const axios = require("axios");

const addDocuwareToken = async (req, res, next) => {
    req.docuwareToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkVBODgzNTEyODE4OTFEQzU5RUVGQ0ZBQjcxMEQ5REY4NDgxNDdFMjQiLCJ4NXQiOiI2b2cxRW9HSkhjV2U3OC1yY1EyZC1FZ1VmaVEiLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2xvZ2luLWVtZWEuZG9jdXdhcmUuY2xvdWQvY2M2MzQ0YzctZTRiOS00NWQ1LTk0ODItZWUyZDc5NmRlNDY0IiwibmJmIjoxNzI2MDU0MzYyLCJpYXQiOjE3MjYwNTQzNjIsImV4cCI6MTcyNjA1Nzk2MiwiYXVkIjoiZG9jdXdhcmUucGxhdGZvcm0iLCJzY29wZSI6WyJkb2N1d2FyZS5wbGF0Zm9ybSJdLCJhbXIiOlsicGFzc3dvcmQiXSwiY2xpZW50X2lkIjoiZG9jdXdhcmUucGxhdGZvcm0ubmV0LmNsaWVudCIsInN1YiI6ImQ3ZjdiOTY2LTA5M2EtNGUxYi05NzE5LTU1MzI3OWU5MTMyMSIsImF1dGhfdGltZSI6MTcyNjA1NDM2MiwiaWRwIjoibG9jYWwiLCJ1c2VybmFtZSI6IkdvZHNvbiBBbmlhZ3VkbyIsInVzZXJfZW1haWwiOiJnb2Rzb24uYW5pYWd1ZG9AYW1uaS5jb20iLCJvcmdhbml6YXRpb24iOiJBbW5pIEludGVybmF0aW9uYWwgUGV0cm9sZXVtIERldmVsb3BtZW50IENvLiIsIm9yZ19ndWlkIjoiY2M2MzQ0YzctZTRiOS00NWQ1LTk0ODItZWUyZDc5NmRlNDY0IiwiaG9zdF9pZCI6IlVuZGVmaW5lZCIsInByb2R1Y3RfdHlwZSI6IlBsYXRmb3JtU2VydmljZSJ9.SoC3uE4zbxTYL380JaOvue7YycYFnIY3ZpLNYiVPGcpT3eP3iNkXzF9SUWwT9BzU43I4OHHTeC2lUWQYIth-vOOOOj07vjWVJjp3NzSg5Wjjii4zJ4-QV03T2PTrs7kY1jNk1Ubc2cji8-0yz4iFNrEMaXHEaVlyAJPdNaoQmcsRMDix2UYaIX-qe6arHDzLx257tuDHP-PUIvwkNZKy_8LwcxmPNQtft0t5bdm5atwWEpje1buw4wih7VH2GrlYgYQMVW--w9T7RkeG1TQX2rFbC4By56dPZdCcvPvLtoscYlyYZH98vt_CUyCblu5XxBbi7vaRZ59HT9MHSy7EcQ"
    next()
    return
    if (!docuwareToken) {
        //Request a new token and pass it to the controller
        const fetchedToken = await fetchDocuwareToken()

        console.log({docuwareToken});
        if (fetchedToken.status === 200 && fetchedToken?.data?.access_token) {
            let currentTime = Date.now()
            
            expiryTime = currentTime + fetchedToken?.data?.expires_in
            docuwareToken = fetchedToken?.data?.access_token
            req.docuwareToken = fetchedToken?.data?.access_token
            next() 
        }
    } else {
        //Authenticate existing token. If token is stil valid, pass it to controller, else fetch a new token
        let currentTime = Date.now()
        if (expiryTime < currentTime ) {
            console.log({tokenExpired: "Token has expired"});
            const fetchedToken = await fetchDocuwareToken()

            console.log({docuwareToken, fetchedToken});
            if (docuwareToken.status === 200 && fetchedToken?.data?.access_token) {
                let currentTime = Date.now()
                
                expiryTime = currentTime + fetchedToken?.data?.expires_in
                docuwareToken = fetchedToken?.data?.access_token
                req.docuwareToken = fetchedToken?.data?.access_token
                next() 
            }
        } else {
            console.log({existingToken: docuwareToken});
            req.docuwareToken = docuwareToken
            next() 
        }
    }

    
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