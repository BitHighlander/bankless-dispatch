"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
require('dotenv').config({ path: "./.env" });
require('dotenv').config({ path: "./../.env" });
require('dotenv').config({ path: "./../../.env" });
require('dotenv').config({ path: "../../../.env" });
require('dotenv').config({ path: "../../../../.env" });
require('dotenv').config({ path: "./../../../../.env" });
var pjson = require('../package.json');
var TAG = " | " + pjson.name + " | ";
var log = require('@pioneer-platform/loggerdog')();
var _a = require('@pioneer-platform/default-redis'), subscriber = _a.subscriber, publisher = _a.publisher, redis = _a.redis;
var cors = require('cors');
var body_parser_1 = __importDefault(require("body-parser"));
var express_1 = __importDefault(require("express"));
var method_override_1 = __importDefault(require("method-override"));
var cookie_1 = require("cookie");
var routes_1 = require("./routes/routes"); // here
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('../api/dist/swagger.json');
var createProxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;
//Rate limiter options
//https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#create-simple-rate-limiter-and-consume-points-on-entry-point
var RateLimiterRedis = require('rate-limiter-flexible').RateLimiterRedis;
var app = (0, express_1.default)();
var server = require('http').Server(app);
var API_PORT = parseInt(process.env["API_PORT_PIONEER"]) || 80;
var RATE_LIMIT_RPM = parseInt(process.env["RATE_LIMIT_TPS"]) || 5;
var COOKIE_NAME = 'example';
//limiter
var rateLimiterRedis = new RateLimiterRedis({
    storeClient: redis,
    points: RATE_LIMIT_RPM,
    duration: 1, // Per second
});
var WHITELIST_CACHE = [];
var rateLimiterMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var auth, path, isWhitelisted, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                if (!req.headers.authorization) return [3 /*break*/, 4];
                auth = req.headers.authorization;
                log.info('path: ', req.url);
                path = req.path;
                if (auth.indexOf('Bearer '))
                    auth.replace('Bearer ', '');
                if (!WHITELIST_CACHE.indexOf(auth)) return [3 /*break*/, 1];
                next();
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, redis.sismember("PIONEER_WHITELIST_KEYS", auth)];
            case 2:
                isWhitelisted = _a.sent();
                if (isWhitelisted) {
                    WHITELIST_CACHE.push(auth);
                    next();
                }
                else {
                    rateLimiterRedis.consume(req.ip)
                        .then(function () {
                        next();
                    })
                        .catch(function (_) {
                        res.status(429).send('Too Many Requests');
                    });
                }
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                rateLimiterRedis.consume(req.ip)
                    .then(function () {
                    next();
                })
                    .catch(function (_) {
                    res.status(429).send('Too Many Requests');
                });
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                e_1 = _a.sent();
                console.error(e_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
var corsOptions = {
    origin: function (origin, callback) {
        if (true) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));
//@TODO too strict
// app.use(rateLimiterMiddleware);
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use((0, method_override_1.default)());
//socket
var SOCKET_MAX_CONNECTIONS = parseInt(process.env["SOCKET_MAX_CONNECTIONS"]) || 20;
var createAdapter = require('@socket.io/redis-adapter').createAdapter;
var createClient = require('redis').createClient;
//socket-io
var io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
var pubClient = createClient(process.env['REDIS_CONNECTION'] || 'redis://127.0.0.1:6379');
var subClient = pubClient.duplicate();
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
app.use('/spec', express_1.default.static('api/dist'));
//REST API v1
(0, routes_1.RegisterRoutes)(app); // and here
//host static spaces assets
// Add a catch-all route for any other routes, serving the 'web' directory
app.use('/', express_1.default.static('web'));
//@TODO this keeps domain if you care
app.use(['/', '/assets', '/coins', '/docs'], createProxyMiddleware({
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
//redis-bridge
subscriber.subscribe('pioneer-events');
subscriber.subscribe('payments');
subscriber.subscribe('pioneer:transactions:all');
subscriber.on('message', function (channel, payloadS) {
    return __awaiter(this, void 0, void 0, function () {
        var tag, payload;
        return __generator(this, function (_a) {
            tag = TAG + ' | publishToFront | ';
            try {
                log.debug(tag, "event: ", payloadS);
                //Push event over socket
                if (channel === 'payments') {
                    payload = JSON.parse(payloadS);
                    payload.event = 'transaction';
                    payloadS = JSON.stringify(payload);
                }
                //legacy hack
                if (channel === 'payments')
                    channel = 'events';
                //
                io.emit(channel, payloadS);
            }
            catch (e) {
                log.error(tag, e);
                throw e;
            }
            return [2 /*return*/];
        });
    });
});
//Error handeling
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    log.error("ERROR: ", err);
    res.status(400).send({
        message: err.message,
        error: err
    });
}
app.use(errorHandler);
server.listen(API_PORT, function () { return console.log("Server started listening to port ".concat(API_PORT)); });
io.on('connection', function (socket) {
    // Get the raw request object from the socket handshake
    var rawRequest = socket.request;
    function parseYourCookie(cookieHeader) {
        //log.info("cookieHeader: ",cookieHeader)
        var cookies = (0, cookie_1.parse)(cookieHeader || '');
        return cookies['example']; // Replace with the actual cookie name
    }
    // Parse and get your desired cookie value from the request
    var cookieValue = parseYourCookie(rawRequest.headers.cookie); // Implement this function
    // Serialize the cookie for the socket connection
    var serializedCookie = (0, cookie_1.serialize)(COOKIE_NAME, cookieValue, {
        sameSite: 'strict',
    });
    // Set the serialized cookie in the socket handshake headers
    socket.handshake.headers.cookie = serializedCookie;
    // Now you can use the cookie in your WebSocket connection
});
