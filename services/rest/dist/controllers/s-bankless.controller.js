"use strict";
/*

    Bankless REST endpoints



 */
// import {bufferToHex} from "ethereumjs-util";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanklessController = exports.ApiError = void 0;
var TAG = ' | API | ';
// import jwt from 'express-jwt';
var pjson = require('../../package.json');
var log = require('@pioneer-platform/loggerdog')();
var _a = require('@pioneer-platform/default-redis'), subscriber = _a.subscriber, publisher = _a.publisher, redis = _a.redis, redisQueue = _a.redisQueue;
var util = require('util');
var uuid_1 = require("uuid");
//TODO if no mongo use nedb?
//https://github.com/louischatriot/nedb
var config = {
    algorithms: ['HS256'],
    secret: 'shhhh', // TODO Put in process.env
};
var connection = require("@pioneer-platform/default-mongo");
var usersDB = connection.get('users');
var assetsDB = connection.get('assets');
var pubkeysDB = connection.get('pubkeys');
var txsDB = connection.get('transactions');
var invocationsDB = connection.get('invocations');
var utxosDB = connection.get('utxo');
var blockchainsDB = connection.get('blockchains');
var dappsDB = connection.get('apps');
var nodesDB = connection.get('nodes');
var ordersDB = connection.get('orders');
var driversDB = connection.get('drivers');
var terminalsDB = connection.get('terminals');
var banklessTxDB = connection.get('bankless-transactions');
var sessionsDB = connection.get('bankless-sessions');
terminalsDB.createIndex({ terminalId: 1 }, { unique: true });
blockchainsDB.createIndex({ blockchain: 1 }, { unique: true });
// blockchainsDB.createIndex({chainId: 1}, {unique: true})
nodesDB.createIndex({ service: 1 }, { unique: true });
usersDB.createIndex({ id: 1 }, { unique: true });
usersDB.createIndex({ username: 1 }, { unique: true });
txsDB.createIndex({ txid: 1 }, { unique: true });
utxosDB.createIndex({ txid: 1 }, { unique: true });
pubkeysDB.createIndex({ pubkey: 1 }, { unique: true });
invocationsDB.createIndex({ invocationId: 1 }, { unique: true });
// assetsDB.createIndex({name: 1}, {unique: true})
// assetsDB.createIndex({assetId: 1}, {unique: true})
assetsDB.createIndex({ caip: 1 }, { unique: true });
txsDB.createIndex({ invocationId: 1 });
// knowledgeDB.createIndex({publicAddress: 1}, {unique: true})
// dapsDB.createIndex({id: 1}, {unique: true})
//globals
var ADMIN_PUBLIC_ADDRESS = process.env['ADMIN_PUBLIC_ADDRESS'];
if (!ADMIN_PUBLIC_ADDRESS)
    throw Error("Invalid ENV missing ADMIN_PUBLIC_ADDRESS");
//rest-ts
var tsoa_1 = require("tsoa");
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(name, statusCode, message) {
        var _this = _super.call(this, message) || this;
        _this.name = name;
        _this.statusCode = statusCode;
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
//route
var BanklessController = exports.BanklessController = /** @class */ (function (_super) {
    __extends(BanklessController, _super);
    function BanklessController() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BanklessController.prototype.online = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tag, online, e_1, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | online | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, redis.smembers('online')];
                    case 2:
                        online = _a.sent();
                        return [2 /*return*/, (online)];
                    case 3:
                        e_1 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_1
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_1.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //global Info
    BanklessController.prototype.banklessInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tag, allTerminals, e_2, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | banklessInfo | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, terminalsDB.find({})];
                    case 2:
                        allTerminals = _a.sent();
                        return [2 /*return*/, allTerminals];
                    case 3:
                        e_2 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_2
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_2.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //global Info
    BanklessController.prototype.terminalListing = function (terminalName) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, output, terminalInfo, e_3, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | terminalListing | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        log.debug(tag, "terminalName: ", terminalName);
                        output = {};
                        return [4 /*yield*/, terminalsDB.findOne({ terminalName: terminalName })];
                    case 2:
                        terminalInfo = _a.sent();
                        log.debug(tag, "terminalInfo: ", terminalInfo);
                        output.terminalInfo = terminalInfo;
                        //get last txs
                        //get cap table
                        return [2 /*return*/, output];
                    case 3:
                        e_3 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_3
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_3.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //global Info
    BanklessController.prototype.driverPrivate = function (authorization, driverId) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, output, accountInfo, banklessAuth, terminalInfo, sessions, e_4, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | driverPrivate | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        log.debug(tag, "queryKey: ", authorization);
                        log.debug(tag, "driverId: ", driverId);
                        output = {};
                        return [4 /*yield*/, redis.hgetall(authorization)];
                    case 2:
                        accountInfo = _a.sent();
                        return [4 /*yield*/, redis.hgetall("bankless:auth:" + authorization)];
                    case 3:
                        banklessAuth = _a.sent();
                        log.debug(tag, "banklessAuth: ", banklessAuth);
                        // let username = accountInfo.username
                        // if(!username) throw Error("unknown token! token: "+authorization)
                        log.debug(tag, "accountInfo: ", accountInfo);
                        return [4 /*yield*/, driversDB.findOne({ driverId: driverId })];
                    case 4:
                        terminalInfo = _a.sent();
                        log.debug(tag, "terminalInfo: ", terminalInfo);
                        output.terminalInfo = terminalInfo;
                        return [4 /*yield*/, sessionsDB.find({ driverId: driverId })];
                    case 5:
                        sessions = _a.sent();
                        output.sessions = sessions;
                        return [2 /*return*/, output];
                    case 6:
                        e_4 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_4
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_4.toString());
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    //global Info
    BanklessController.prototype.terminalPrivate = function (authorization, terminalName) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, output, accountInfo, banklessAuth, terminalInfo, sessions, e_5, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | terminalPrivate | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        log.debug(tag, "queryKey: ", authorization);
                        log.debug(tag, "terminalName: ", terminalName);
                        output = {};
                        return [4 /*yield*/, redis.hgetall(authorization)];
                    case 2:
                        accountInfo = _a.sent();
                        return [4 /*yield*/, redis.hgetall("bankless:auth:" + authorization)];
                    case 3:
                        banklessAuth = _a.sent();
                        log.debug(tag, "banklessAuth: ", banklessAuth);
                        // let username = accountInfo.username
                        // if(!username) throw Error("unknown token! token: "+authorization)
                        log.debug(tag, "accountInfo: ", accountInfo);
                        return [4 /*yield*/, terminalsDB.findOne({ terminalName: terminalName })];
                    case 4:
                        terminalInfo = _a.sent();
                        log.debug(tag, "terminalInfo: ", terminalInfo);
                        output.terminalInfo = terminalInfo;
                        return [4 /*yield*/, sessionsDB.find({ terminalName: terminalName })];
                    case 5:
                        sessions = _a.sent();
                        output.sessions = sessions;
                        return [2 /*return*/, output];
                    case 6:
                        e_5 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_5
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_5.toString());
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    //Submit review
    BanklessController.prototype.submitDriver = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, output, banklessAuth, entry, saveDb, e_6, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | submitDriver | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        output = {};
                        log.info(tag, "body: ", body);
                        log.info(tag, "authorization: ", authorization);
                        return [4 /*yield*/, redis.hgetall("bankless:auth:" + authorization)];
                    case 2:
                        banklessAuth = _a.sent();
                        log.debug(tag, "banklessAuth: ", banklessAuth);
                        entry = {
                            pubkey: body.pubkey,
                            created: new Date().getTime(),
                            location: body.location
                        };
                        return [4 /*yield*/, driversDB.insert(entry)];
                    case 3:
                        saveDb = _a.sent();
                        output.success = true;
                        output.saveDb = saveDb;
                        return [2 /*return*/, (output)];
                    case 4:
                        e_6 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_6
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_6.toString());
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    //startSession
    BanklessController.prototype.updateDriver = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, driverId, terminalInfo, txHistory, e_7, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | updateDriver | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        log.debug(tag, "body: ", body);
                        log.debug(tag, "authorization: ", authorization);
                        driverId = body.driverId;
                        return [4 /*yield*/, driversDB.update({ driverId: driverId }, { $set: { location: location } })];
                    case 2:
                        terminalInfo = _a.sent();
                        return [4 /*yield*/, banklessTxDB.find({ driverId: driverId })];
                    case 3:
                        txHistory = _a.sent();
                        terminalInfo.txHistory = txHistory;
                        return [2 /*return*/, (terminalInfo)];
                    case 4:
                        e_7 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_7
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_7.toString());
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    //Submit review
    BanklessController.prototype.submitTerminal = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, output, banklessAuth, entry, saveDb, session, e_8, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | submitTerminal | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        log.debug(tag, "body: ", body);
                        log.debug(tag, "authorization: ", authorization);
                        // if(!body.signer) throw Error("invalid signed payload missing signer!")
                        // if(!body.payload) throw Error("invalid signed payload missing payload!")
                        // if(!body.signature) throw Error("invalid signed payload missing !")
                        if (!body.terminalName)
                            throw Error("invalid terminalName missing !");
                        if (!body.rate)
                            throw Error("invalid rate missing !");
                        if (!body.pubkey)
                            throw Error("invalid pubkey missing !");
                        if (!body.TOTAL_CASH)
                            throw Error("invalid TOTAL_CASH missing !");
                        if (!body.TOTAL_DAI)
                            throw Error("invalid TOTAL_DAI missing !");
                        if (!body.location)
                            throw Error("invalid location missing !");
                        if (!body.captable)
                            throw Error("invalid captable missing !");
                        output = {};
                        return [4 /*yield*/, redis.hgetall("bankless:auth:" + authorization)];
                    case 2:
                        banklessAuth = _a.sent();
                        log.debug(tag, "banklessAuth: ", banklessAuth);
                        if (Object.keys(banklessAuth).length === 0) {
                            //new terminal
                        }
                        entry = {
                            terminalId: body.terminalId,
                            terminalName: body.terminalName,
                            tradePair: body.tradePair,
                            rate: body.rate,
                            pubkey: body.pubkey,
                            TOTAL_CASH: body.TOTAL_CASH,
                            TOTAL_DAI: body.TOTAL_DAI,
                            captable: body.captable,
                            fact: "",
                            location: body.location
                        };
                        return [4 /*yield*/, terminalsDB.insert(entry)];
                    case 3:
                        saveDb = _a.sent();
                        log.debug(tag, "saveDb: ", saveDb);
                        output.success = true;
                        output.saveDb = saveDb;
                        session = {
                            terminalName: entry.terminalName,
                            type: "onStart",
                            action: "start device",
                            sessionId: body.sessionId,
                            location: body.location,
                            rate: entry.rate,
                            TOTAL_CASH: entry.TOTAL_CASH,
                            TOTAL_DAI: entry.TOTAL_DAI,
                            start: new Date()
                        };
                        sessionsDB.insert(session);
                        output.sessionId = session.sessionId;
                        //txs history
                        return [2 /*return*/, (output)];
                    case 4:
                        e_8 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_8
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_8.toString());
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BanklessController.prototype.updateTerminalCaptable = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, captable, terminalName, terminalInfo, e_9, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | updateTerminalCaptable | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        log.debug(tag, "body: ", body);
                        log.debug(tag, "authorization: ", authorization);
                        captable = body.captable;
                        terminalName = body.terminalName;
                        return [4 /*yield*/, terminalsDB.update({ terminalName: terminalName }, { $set: { captable: captable } })];
                    case 2:
                        terminalInfo = _a.sent();
                        return [2 /*return*/, (terminalInfo)];
                    case 3:
                        e_9 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_9
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_9.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //startSession
    BanklessController.prototype.updateTerminal = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, captable, location_1, terminalName, rate, TOTAL_CASH, TOTAL_DAI, terminalInfo, txHistory, e_10, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | updateTerminal | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        log.debug(tag, "body: ", body);
                        log.debug(tag, "authorization: ", authorization);
                        // if(!body.signer) throw Error("invalid signed payload missing signer!")
                        // if(!body.payload) throw Error("invalid signed payload missing payload!")
                        // if(!body.signature) throw Error("invalid signed payload missing !")
                        // if(!body.nonce) throw Error("invalid signed payload missing !")
                        if (!body.terminalName)
                            throw Error("invalid terminalName missing !");
                        if (!body.rate)
                            throw Error("invalid rate missing !");
                        if (!body.pubkey)
                            throw Error("invalid pubkey missing !");
                        if (!body.TOTAL_CASH)
                            throw Error("invalid TOTAL_CASH missing !");
                        if (!body.TOTAL_DAI)
                            throw Error("invalid TOTAL_DAI missing !");
                        if (!body.location)
                            throw Error("invalid location missing !");
                        if (!body.captable)
                            throw Error("invalid captable missing !");
                        captable = body.captable;
                        location_1 = body.location;
                        terminalName = body.terminalName;
                        rate = body.lastRate;
                        TOTAL_CASH = body.TOTAL_CASH;
                        TOTAL_DAI = body.TOTAL_DAI;
                        publisher.publish('bankless', JSON.stringify({ type: "rate", payload: { terminalName: terminalName, rate: rate, TOTAL_CASH: TOTAL_CASH, TOTAL_DAI: TOTAL_DAI } }));
                        return [4 /*yield*/, terminalsDB.update({ terminalName: terminalName }, { $set: { location: location_1, rate: rate, TOTAL_CASH: TOTAL_CASH, TOTAL_DAI: TOTAL_DAI, captable: captable } })];
                    case 2:
                        terminalInfo = _a.sent();
                        return [4 /*yield*/, banklessTxDB.find({ terminalName: terminalName })];
                    case 3:
                        txHistory = _a.sent();
                        terminalInfo.txHistory = txHistory;
                        return [2 /*return*/, (terminalInfo)];
                    case 4:
                        e_10 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_10
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_10.toString());
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    //startSession
    BanklessController.prototype.submitOrder = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, online_1, session, result, terminals, onlineTerminals, drivers, onlineDrivers_1, calculateDistance_1, combinations_1, nearestMatch, match, e_11, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | submitOrder | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        log.info(tag, "body: ", body);
                        log.info(tag, "authorization: ", authorization);
                        return [4 /*yield*/, redis.smembers('online')];
                    case 2:
                        online_1 = _a.sent();
                        log.info(tag, "online: ", online_1);
                        session = {
                            id: (0, uuid_1.v4)(),
                            market: "USD_USDC",
                            user: body.user,
                            amount: body.amount,
                            amountOutMin: body.amountOutMin,
                        };
                        return [4 /*yield*/, ordersDB.insert(session)
                            //get terminal
                        ];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, terminalsDB.find()];
                    case 4:
                        terminals = _a.sent();
                        console.log("get terminal: ", terminals);
                        onlineTerminals = terminals.filter(function (terminal) { return online_1.includes(terminal.terminalName); });
                        console.log("Online terminals: ", onlineTerminals);
                        return [4 /*yield*/, driversDB.find()];
                    case 5:
                        drivers = _a.sent();
                        console.log("get driver: ", drivers);
                        onlineDrivers_1 = drivers.filter(function (driver) {
                            var driverId = "driver:" + driver.pubkey; // Ensure this matches the format in the `online` array
                            return online_1.includes(driverId);
                        });
                        console.log("Online drivers: ", onlineDrivers_1);
                        calculateDistance_1 = function (p1, p2) {
                            var toRadians = function (degree) { return degree * (Math.PI / 180); };
                            var earthRadiusMiles = 3958.8; // Radius of the Earth in miles
                            var lat1Radians = toRadians(p1.lat);
                            var lat2Radians = toRadians(p2.lat);
                            var deltaLatRadians = toRadians(p2.lat - p1.lat);
                            var deltaLngRadians = toRadians(p2.lng - p1.lng);
                            var a = Math.sin(deltaLatRadians / 2) * Math.sin(deltaLatRadians / 2) +
                                Math.cos(lat1Radians) *
                                    Math.cos(lat2Radians) *
                                    Math.sin(deltaLngRadians / 2) *
                                    Math.sin(deltaLngRadians / 2);
                            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            return earthRadiusMiles * c;
                        };
                        combinations_1 = [];
                        onlineTerminals.forEach(function (terminal) {
                            onlineDrivers_1.forEach(function (driver) {
                                var distance = calculateDistance_1({ lat: terminal.lat, lng: terminal.lng }, { lat: driver.lat, lng: driver.lng });
                                combinations_1.push({ terminal: terminal, driver: driver, distance: distance });
                            });
                        });
                        // Step 3: Sort combinations by distance to find the nearest match
                        combinations_1.sort(function (a, b) { return a.distance - b.distance; });
                        // Assuming you want at least one match
                        if (combinations_1.length > 0) {
                            nearestMatch = combinations_1[0];
                            match = {
                                id: (0, uuid_1.v4)(),
                                terminal: nearestMatch.terminal.terminalName || "sampleTerminal",
                                driverId: "driver:" + nearestMatch.driver.pubkey,
                                session: session,
                                "event": "match",
                                "type": "order",
                                driver: nearestMatch.driver.name,
                                mm: "",
                                "timestamp": new Date(),
                                status: "start",
                                complete: false
                            };
                            publisher.publish('match', JSON.stringify(match));
                            console.log("Nearest match found and published");
                            // Assuming result is the outcome you want to return
                        }
                        else {
                            console.log("No matches found");
                            // Handle the case where no matches are found
                        }
                        return [2 /*return*/, result];
                    case 6:
                        e_11 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_11
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_11.toString());
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    //startSession
    BanklessController.prototype.pushEvent = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, session, result, e_12, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | pushEvent | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        log.debug(tag, "body: ", body);
                        log.debug(tag, "authorization: ", authorization);
                        // if(!body.signer) throw Error("invalid signed payload missing signer!")
                        // if(!body.payload) throw Error("invalid signed payload missing payload!")
                        // if(!body.signature) throw Error("invalid signed payload missing !")
                        // if(!body.nonce) throw Error("invalid signed payload missing !")
                        //must be lp add or remove
                        if (!body.type)
                            throw Error("invalid type!");
                        if (!body.event)
                            throw Error("invalid event!");
                        if (!body.terminalName)
                            throw Error("invalid type!");
                        session = {
                            terminalName: body.terminalName,
                            type: body.type,
                            event: body.event,
                            sessionId: body.sessionId,
                            location: body.location,
                            rate: body.rate,
                            TOTAL_CASH: body.TOTAL_CASH,
                            TOTAL_DAI: body.TOTAL_DAI,
                        };
                        return [4 /*yield*/, sessionsDB.insert(session)];
                    case 2:
                        result = _a.sent();
                        log.debug(tag, "result: ", result);
                        return [2 /*return*/, (result)];
                    case 3:
                        e_12 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_12
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_12.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    //startSession
    BanklessController.prototype.startSession = function (authorization, body) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, actionId, resultCreate, result, e_13, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | startSession | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        log.debug(tag, "body: ", body);
                        log.debug(tag, "authorization: ", authorization);
                        // if(!body.signer) throw Error("invalid signed payload missing signer!")
                        // if(!body.payload) throw Error("invalid signed payload missing payload!")
                        // if(!body.signature) throw Error("invalid signed payload missing !")
                        // if(!body.nonce) throw Error("invalid signed payload missing !")
                        //must be lp add or remove
                        if (!body.type)
                            throw Error("invalid type!");
                        if (!body.address)
                            throw Error("invalid required address!");
                        if (!body.terminalName)
                            throw Error("invalid required terminalName!");
                        actionId = "action:" + (0, uuid_1.v4)();
                        body.actionId = actionId;
                        publisher.publish('bankless', JSON.stringify({ type: "terminal", payload: body }));
                        return [4 /*yield*/, redisQueue.blpop(actionId, 30)];
                    case 2:
                        resultCreate = _a.sent();
                        log.debug(tag, "resultCreate: ", resultCreate);
                        log.debug(tag, "resultCreate: ", resultCreate[1]);
                        log.debug(tag, "resultCreate: ", typeof (resultCreate[1]));
                        log.debug(tag, "resultCreate: ", JSON.parse(resultCreate[1]));
                        result = JSON.parse(resultCreate[1]);
                        log.debug(tag, "result: ", result);
                        return [2 /*return*/, (result)];
                    case 3:
                        e_13 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_13
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_13.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    __decorate([
        (0, tsoa_1.Get)('/online')
    ], BanklessController.prototype, "online", null);
    __decorate([
        (0, tsoa_1.Get)('/bankless/info')
    ], BanklessController.prototype, "banklessInfo", null);
    __decorate([
        (0, tsoa_1.Get)('/bankless/terminal/{terminalName}')
    ], BanklessController.prototype, "terminalListing", null);
    __decorate([
        (0, tsoa_1.Get)('/bankless/driver/private/{driverId}'),
        __param(0, (0, tsoa_1.Header)('Authorization'))
    ], BanklessController.prototype, "driverPrivate", null);
    __decorate([
        (0, tsoa_1.Get)('/bankless/terminal/private/{terminalName}'),
        __param(0, (0, tsoa_1.Header)('Authorization'))
    ], BanklessController.prototype, "terminalPrivate", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/driver/submit')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "submitDriver", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/driver/update')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "updateDriver", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/terminal/submit')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "submitTerminal", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/terminal/captable/update')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "updateTerminalCaptable", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/terminal/update')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "updateTerminal", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/order/submit')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "submitOrder", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/terminal/event')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "pushEvent", null);
    __decorate([
        (0, tsoa_1.Post)('/bankless/terminal/startSession')
        //CreateAppBody
        ,
        __param(0, (0, tsoa_1.Header)('Authorization')),
        __param(1, (0, tsoa_1.Body)())
    ], BanklessController.prototype, "startSession", null);
    BanklessController = __decorate([
        (0, tsoa_1.Tags)('Bankless Endpoints'),
        (0, tsoa_1.Route)('')
    ], BanklessController);
    return BanklessController;
}(tsoa_1.Controller));
