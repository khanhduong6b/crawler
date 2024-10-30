fetch("https://apibhx.tgdd.vn/Location/GetStoreByLocation", {
    "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "access-control-allow-origin": "*",
        "authorization": "Bearer 00C4470F2A5AB28B07543534CDDB6D2B",
        "content-type": "application/json",
        "deviceid": "57055e67-9ffa-4d20-a64c-34bbdb99b068",
        "platform": "webnew",
        "referer-url": "https://www.bachhoaxanh.com/he-thong-sieu-thi",
        "reversehost": "http://bhxapi.live",
        "sec-ch-ua": "\"Chromium\";v=\"129\", \"Not=A?Brand\";v=\"8\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "xapikey": "bhx-api-core-2022",
        "Referer": "https://www.bachhoaxanh.com/he-thong-sieu-thi",
        "Referrer-Policy": "no-referrer-when-downgrade"
    },
    "body": "{\"provinceId\":3,\"districtId\":0,\"wardId\":0,\"latitude\":0,\"longitude\":0}",
    "method": "POST"
}).then(res => res.json()).then(data => console.log(data));