const url = "https://masothue.com/Search/"
const formData = new URLSearchParams();
const https = require('https');

formData.append("q", "052202000339");
formData.append("type", "personalTax");
formData.append("token", "dT7hMxs1FY");
formData.append("force-search", 1);

const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 5, timeout: 10000, keepAliveMsecs: 10000, autoSelectFamily: false })
const options = {
    hostname: 'workflow.base.vn',
    path: `/extapi/v1/job/create`,
    method: 'POST',
    agent: keepAliveAgent,
    headers: {
        'Accept': 'plain/html',
        'Accept-Encoding': '*',
        'Content-Type': 'application/x-www-form-urlencoded', // Add this line
    }
}

new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
        const chunks = []
        res.on('data', (chunk) => {
            chunks.push(chunk)
        })
        res.on('end', () => {
            const data = Buffer.concat(chunks).toString()
            try {
                const result = JSON.parse(data)
                if (result.code == 0) {
                   console.log('Error create job:', result.error)
                    return reject(result)
                }

                console.log('Create job success:', result)
                return resolve(result)
            } catch (error) {
                console.log('Error create job:', error)
                return reject(error)
            }
        })
    })
    req.on('error', (error) => {
        reject(error)
    })
    req.write(formData.toString())
    req.end()
})