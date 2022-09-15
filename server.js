var webpush = require('web-push');
const express = require('express');
const https = require('https');
const fs = require('fs');

var cors = require('cors'); 

const port = process.env.PORT || 4999;

const app = express();

app.use(cors());    //cross origin 허용
app.use(express.json());    //json사용
app.use(express.urlencoded({ extended: true})); //body-parse사용

app.use('/client', express.static('client'));       //구독 페이지
app.use('/sketcher', express.static('sketcher'));   //Push 전송 페이지

app.get('/', (req, res) =>{
    res.send("Web Push Server");
});

const options = {
    cert: fs.readFileSync('localhost+3.pem'),
    key: fs.readFileSync('localhost+3-key.pem')
};  

const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
    'mailto:transpine@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// 1. service-worker의 pushManager가 Registration을 하기 위한  키를 받아오는 GET
app.get('/push/key', (req, res) => {
    console.log(`publick key sent: ${vapidKeys.publicKey}`);
    res.send({
        key: vapidKeys.publicKey
    });
});

// 2. 구독 POST
const temp_subs = [];
app.post('/push/subscribe', (req, res) => {
    temp_subs.push(req.body.subscription);
    console.log(`subscribed : ${JSON.stringify(req.body.subscription)}`);
    res.send('Subscribed');
});

// 3. 등록된 브라우저 들에게 푸시를 보내는 POST
app.post('/push/notify', (req, res) => {
    console.log(`-------------------------------------------`);
    console.log(`notify requested : ${JSON.stringify(req.body)}`);
    let payload = {};
    payload.title = req.body.title;
    payload.message = req.body.message;
    payload.image_url = req.body.image_url;

    for(const subs of temp_subs){
        webpush.sendNotification(subs, JSON.stringify(payload))
        .then( (response) => {
            console.log('sent notification');
            res.sendStatus(201);
        }).catch( (err) => {
            console.error(`notification error : ${err}`);
            res.sendStatus(500);
        });
    }
});

https.createServer(options, app).listen( port, () => {
    console.log(`webpush server running, port:${port}`);
});