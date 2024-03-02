require('dotenv').config()
require('dotenv').config({path:"./.env"})
require('dotenv').config({path:"./../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"../../../../.env"})
require('dotenv').config({path:"./../../../../.env"})

const pjson = require('../package.json');
const TAG = " | "+ pjson.name +" | "
const log = require('@pioneer-platform/loggerdog')()
const {subscriber, publisher, redis} = require('@pioneer-platform/default-redis')
const cors = require('cors')
import bodyParser from 'body-parser';
import express from 'express';
import methodOverride from 'method-override';
import { serialize, parse } from 'cookie';
import { RegisterRoutes } from './routes/routes';  // here
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../api/dist/swagger.json')
const { createProxyMiddleware } = require('http-proxy-middleware');

//Rate limiter options
//https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#create-simple-rate-limiter-and-consume-points-on-entry-point
const { RateLimiterRedis } = require('rate-limiter-flexible');

const app = express();
const server = require('http').Server(app);
let API_PORT = parseInt(process.env["API_PORT_PIONEER"]) || 80
let RATE_LIMIT_RPM = parseInt(process.env["RATE_LIMIT_TPS"]) || 5
const COOKIE_NAME = 'example';

//limiter
const rateLimiterRedis = new RateLimiterRedis({
    storeClient: redis,
    points: RATE_LIMIT_RPM, // Number of points
    duration: 1, // Per second
});

const WHITELIST_CACHE = []
const rateLimiterMiddleware = async (req, res, next) => {
    try{
        if(req.headers.authorization){
            let auth = req.headers.authorization
            log.info('path: ',req.url)
            let path = req.path
            if(auth.indexOf('Bearer ')) auth.replace('Bearer ','')

            //if in cache
            if(WHITELIST_CACHE.indexOf(auth)){
                next();
            } else {
                let isWhitelisted = await redis.sismember("PIONEER_WHITELIST_KEYS",auth)
                if(isWhitelisted){
                    WHITELIST_CACHE.push(auth)
                    next();
                } else {
                    rateLimiterRedis.consume(req.ip)
                        .then(() => {
                            next();
                        })
                        .catch(_ => {
                            res.status(429).send('Too Many Requests');
                        });
                }
            }
        } else {
            rateLimiterRedis.consume(req.ip)
                .then(() => {
                    next();
                })
                .catch(_ => {
                    res.status(429).send('Too Many Requests');
                });
        }
    }catch(e){
        console.error(e)
    }
};

var corsOptions = {
    origin: function (origin, callback) {
        if (true) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}


app.use(cors(corsOptions))
//@TODO too strict
// app.use(rateLimiterMiddleware);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

//socket
let SOCKET_MAX_CONNECTIONS = parseInt(process.env["SOCKET_MAX_CONNECTIONS"]) || 20

const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

//socket-io
let io = require('socket.io')(server,{
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const pubClient = createClient(process.env['REDIS_CONNECTION'] || 'redis://127.0.0.1:6379');
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

io.sockets.setMaxListeners(SOCKET_MAX_CONNECTIONS);

//web
// app.use('/',express.static('dist/spa'));
// app.get('/', (req, res) => {
//     res.redirect('https://pioneer-frontend-v3.vercel.app' + req.path);
// });


//docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//swagger.json
app.use('/spec', express.static('api/dist'));

//REST API v1
RegisterRoutes(app);  // and here

//host static spaces assets
// Add a catch-all route for any other routes, serving the 'web' directory
app.use('/', express.static('web'));

//@TODO this keeps domain if you care
app.use(['/','/assets','/coins','/docs'], createProxyMiddleware({
    target: 'https://swaps-pro-v7.vercel.app',
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
        // Remove potential security headers
        delete proxyRes.headers['strict-transport-security'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-security-policy'];
        delete proxyRes.headers['x-webkit-csp'];
        delete proxyRes.headers['public-key-pins'];
    }
}));

//globals
let globalSockets = {}
let usersBySocketId = {}
let usersByUsername = {}
let usersByKey = {}
let channel_history_max = 10;



//Error handeling
function errorHandler (err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    log.error("ERROR: ",err)
    res.status(400).send({
        message: err.message,
        error: err
    });
}
app.use(errorHandler)

server.listen(API_PORT, () => console.log(`Server started listening to port ${API_PORT}`));

/**
 *
 * subscribe to Payments
 *       Socket.io
 *
 *       Goals:
 *          * User subs to individual feed
 *          * announce when online
 *
 *
 */

io.on('connection', async function(socket){
    let tag = TAG + ' | io connection | '
    log.info(tag,'a user connected', socket.id," user: ",usersByUsername[socket.id]);
    redis.sadd("online:users",socket.id)
    redis.hincrby("globals","usersOnline",Object.keys(usersByUsername).length)

    //set into global
    globalSockets[socket.id] = socket

    socket.on('disconnect', function(){
        let username = usersBySocketId[socket.id]
        log.debug(tag,socket.id+" username: "+username+' disconnected');
        redis.srem('online',username)
        //remove socket.id from username list
        if(usersByUsername[username])usersByUsername[username].splice(usersByUsername[username].indexOf(socket.id), 1);
        delete globalSockets[socket.id]
        delete usersBySocketId[socket.id]
        redis.hset("globals","usersOnline",Object.keys(usersByUsername).length)
    });

    socket.on('join', async function(msg){
        log.debug(tag,'**** Join event! : ', typeof(msg));
        //if(typeof(msg) === "string") msg = JSON.parse(msg)
        log.debug(tag,"message: ",msg)

        let queryKey = msg.queryKey
        if(queryKey && msg.username){
            log.debug(tag,"GIVEN: username: ",msg.username)
            //get pubkeyInfo
            let queryKeyInfo = await redis.hgetall(queryKey)
            log.debug(tag,"ACTUAL: username: ",queryKeyInfo.username)
            if(queryKeyInfo.username === msg.username){
                log.debug(tag,"session valid starting!")
                log.debug(tag,"socket.id: ",socket.id)
                log.debug(tag,"msg.username: ",msg.username)
                usersBySocketId[socket.id] = msg.username
                if(!usersByUsername[msg.username]) usersByUsername[msg.username] = []
                usersByUsername[msg.username].push(socket.id)
                redis.sadd('online',msg.username)
                let subscribePayload = {
                    socketId:socket.id,
                    success:true,
                    username:msg.username
                }
                globalSockets[socket.id].emit('subscribedToUsername', subscribePayload);
            } else if(queryKeyInfo.username && queryKeyInfo.username !== msg.username) {
                log.error(tag,"Failed to join! pubkeyInfo.username: "+queryKeyInfo.username+" msg.username: "+msg.username)
                let error = {
                    code:6,
                    msg:"(error) Failed to join! pubkeyInfo.username: "+queryKeyInfo.username+" msg.username: "+msg.username
                }
                globalSockets[socket.id].emit('errorMessage', error);
            }else if(!queryKeyInfo.username){
                //new queryKey
                //register Username
                log.debug(tag,"New queryKey! msg.username: ",msg.username)
                await redis.hset(queryKey,"username",msg.username)
                await redis.hset(msg.username,"queryKey",queryKey)
                usersBySocketId[socket.id] = msg.username
                if(!usersByUsername[msg.username]) usersByUsername[msg.username] = []
                usersByUsername[msg.username].push(socket.id)
                redis.sadd('online',msg.username)
                let subscribePayload = {
                    socketId:socket.id,
                    success:true,
                    username:msg.username
                }
                globalSockets[socket.id].emit('subscribedToUsername', subscribePayload);
            } else {
                log.error(tag,"Failed to join! pubkeyInfo.username: "+queryKeyInfo.username+" msg.username: "+msg.username)
                let error = {
                    code:7,
                    msg:"Failed to join! unknown queryKey!"
                }
                globalSockets[socket.id].emit('errorMessage', error);
            }

        } else if(msg.queryKey){
            log.debug(tag,"No username given! subbing to queryKey!")
            if(!usersByKey[msg.queryKey]) {
                usersByKey[msg.queryKey] = [socket.id]
            } else {
                usersByKey[msg.queryKey].push(socket.id)
            } //edge case multiple sockets on same key, push to all
            let connectPayload = {
                success:true,
            }
            globalSockets[socket.id].emit('connected', connectPayload);
            log.debug(tag,"sdk subscribed to apiKey: ",msg.queryKey)
            log.debug(tag,"usersByKey: ",usersByKey)
        } else {
            log.error(tag,"invalid join request! ")
        }
    });

    socket.on('event', function(msg){
        log.debug(tag,'event ****************: ' + msg);
    })
    socket.on('message', function(msg){
        log.debug(tag,'message ****************: ' , msg);
        if(msg.actionId){
            //actionId
            redis.lpush(msg.actionId,JSON.stringify(msg))
        }
    })

    socket.on('error', function(msg){
        log.error(tag,'error message ****************: ' , msg);
    })
});

//redis-bridge
subscriber.subscribe('pioneer-events');
subscriber.subscribe('match');
subscriber.subscribe('payments');
subscriber.subscribe('message');
subscriber.subscribe('pioneer:transactions:all');

subscriber.on('message', async function (channel, payloadS) {
    let tag = TAG + ' | publishToFront | ';
    try {
        log.debug(tag,"channel: ",channel)

        log.info(tag,"event: ",payloadS)
        //Push event over socket
        if(channel === 'payments'){
            let payload = JSON.parse(payloadS)
            payload.event = 'transaction'
            payloadS = JSON.stringify(payload)
        }

        //legacy hack
        if(channel === 'payments') channel = 'events'

        if(channel === 'match'){
            let payload = JSON.parse(payloadS)
            console.log("payload: ",payload)
            // console.log("usersByUsername: ",usersByUsername)
            // console.log("globalSockets: ",globalSockets)
            console.log("usersByUsername[payload.driver]: ",usersByUsername[payload.driverId])
            console.log("usersByUsername[payload.terminal]: ",usersByUsername[payload.terminal])
            //send event to market maker
            // globalSockets[usersByUsername[payload.driver]].emit('match', payloadS)

            //send event to driver
            if(usersByUsername[payload.driverId])globalSockets[usersByUsername[payload.driverId]].emit('message', payloadS)

            //send event to terminal
            if(usersByUsername[payload.terminal])globalSockets[usersByUsername[payload.terminal]].emit('message', payloadS)

            //send event to customer
            if(usersByUsername[payload.customerId])globalSockets[usersByUsername[payload.customerId]].emit('message', payloadS)
        }




    } catch (e) {
        log.error(tag, e);
        // throw e
    }
});


// io.on('connection', (socket) => {
//     // Get the raw request object from the socket handshake
//     const rawRequest = socket.request;
//
//     function parseYourCookie(cookieHeader) {
//         //log.info("cookieHeader: ",cookieHeader)
//         const cookies = parse(cookieHeader || '');
//         return cookies['example']; // Replace with the actual cookie name
//     }
//
//     // Parse and get your desired cookie value from the request
//     const cookieValue = parseYourCookie(rawRequest.headers.cookie); // Implement this function
//
//     // Serialize the cookie for the socket connection
//     const serializedCookie = serialize(COOKIE_NAME, cookieValue, {
//         sameSite: 'strict',
//     });
//
//     // Set the serialized cookie in the socket handshake headers
//     socket.handshake.headers.cookie = serializedCookie;
//
//     // Now you can use the cookie in your WebSocket connection
// });
