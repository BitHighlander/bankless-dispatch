/*

    Bankless REST endpoints



 */
// import {bufferToHex} from "ethereumjs-util";

let TAG = ' | API | '
// import jwt from 'express-jwt';
const pjson = require('../../package.json');
const log = require('@pioneer-platform/loggerdog')()
const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')

const util = require('util')
import { v4 as uuidv4 } from 'uuid';
//TODO if no mongo use nedb?
//https://github.com/louischatriot/nedb

let config = {
    algorithms: ['HS256' as const],
    secret: 'shhhh', // TODO Put in process.env
};


let connection  = require("@pioneer-platform/default-mongo")
let usersDB = connection.get('users')
let assetsDB = connection.get('assets')
let pubkeysDB = connection.get('pubkeys')
let txsDB = connection.get('transactions')
let invocationsDB = connection.get('invocations')
let utxosDB = connection.get('utxo')
let blockchainsDB = connection.get('blockchains')
let dappsDB = connection.get('apps')
let nodesDB = connection.get('nodes')
let ordersDB = connection.get('orders')
let driversDB = connection.get('drivers')
let terminalsDB = connection.get('terminals')
let banklessTxDB = connection.get('bankless-transactions')
let sessionsDB = connection.get('bankless-sessions')
terminalsDB.createIndex({terminalId: 1}, {unique: true})
blockchainsDB.createIndex({blockchain: 1}, {unique: true})
// blockchainsDB.createIndex({chainId: 1}, {unique: true})
nodesDB.createIndex({service: 1}, {unique: true})
usersDB.createIndex({id: 1}, {unique: true})
usersDB.createIndex({username: 1}, {unique: true})
txsDB.createIndex({txid: 1}, {unique: true})
utxosDB.createIndex({txid: 1}, {unique: true})
pubkeysDB.createIndex({pubkey: 1}, {unique: true})
invocationsDB.createIndex({invocationId: 1}, {unique: true})
// assetsDB.createIndex({name: 1}, {unique: true})
// assetsDB.createIndex({assetId: 1}, {unique: true})
assetsDB.createIndex({caip: 1}, {unique: true})
txsDB.createIndex({invocationId: 1})
// knowledgeDB.createIndex({publicAddress: 1}, {unique: true})
// dapsDB.createIndex({id: 1}, {unique: true})
//globals

const ADMIN_PUBLIC_ADDRESS = process.env['ADMIN_PUBLIC_ADDRESS']
if(!ADMIN_PUBLIC_ADDRESS) throw Error("Invalid ENV missing ADMIN_PUBLIC_ADDRESS")

//rest-ts
import { Body, Controller, Get, Post, Route, Tags, SuccessResponse, Query, Request, Response, Header } from 'tsoa';

import {
    Error,
    CreateAppBody
} from "@pioneer-platform/pioneer-types";
import {recoverPersonalSignature} from "eth-sig-util";


export class ApiError extends Error {
    private statusCode: number;
    constructor(name: string, statusCode: number, message?: string) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
    }
}

//route
@Tags('Bankless Endpoints')
@Route('')
export class BanklessController extends Controller {


    @Get('/online')
    public async online() {
        let tag = TAG + " | online | "
        try{
            let online = await redis.smembers('online')
            return(online)
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //global Info
    @Get('/bankless/info')
    public async banklessInfo() {
        let tag = TAG + " | banklessInfo | "
        try{

            //get all terminals
            let allTerminals = await terminalsDB.find({})

            return allTerminals
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //global Info
    @Get('/bankless/terminal/{terminalName}')
    public async terminalListing(terminalName: string) {
        let tag = TAG + " | terminalListing | "
        try{

            log.debug(tag,"terminalName: ",terminalName)
            let output:any = {}
            // let username = accountInfo.username
            // if(!username) throw Error("unknown token! token: "+authorization)

            //if valid give terminal history
            let terminalInfo = await terminalsDB.findOne({terminalName})
            log.debug(tag,"terminalInfo: ",terminalInfo)
            output.terminalInfo = terminalInfo

            //get last txs

            //get cap table

            return output
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //global Info
    @Get('/bankless/driver/private/{driverId}')
    public async driverPrivate(@Header('Authorization') authorization: string, driverId: string) {
        let tag = TAG + " | driverPrivate | "
        try{
            log.debug(tag,"queryKey: ",authorization)
            log.debug(tag,"driverId: ",driverId)
            let output:any = {}
            let accountInfo = await redis.hgetall(authorization)
            let banklessAuth = await redis.hgetall("bankless:auth:"+authorization)
            log.debug(tag,"banklessAuth: ",banklessAuth)
            // let username = accountInfo.username
            // if(!username) throw Error("unknown token! token: "+authorization)
            log.debug(tag,"accountInfo: ",accountInfo)

            //if valid give terminal history
            let terminalInfo = await driversDB.findOne({driverId})
            log.debug(tag,"terminalInfo: ",terminalInfo)
            output.terminalInfo = terminalInfo

            //get last txs

            //get cap table

            //get sessions:
            let sessions = await sessionsDB.find({driverId})
            output.sessions = sessions

            return output
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //global Info
    @Get('/bankless/terminal/private/{terminalName}')
    public async terminalPrivate(@Header('Authorization') authorization: string, terminalName: string) {
        let tag = TAG + " | terminalPrivate | "
        try{
            log.debug(tag,"queryKey: ",authorization)
            log.debug(tag,"terminalName: ",terminalName)
            let output:any = {}
            let accountInfo = await redis.hgetall(authorization)
            let banklessAuth = await redis.hgetall("bankless:auth:"+authorization)
            log.debug(tag,"banklessAuth: ",banklessAuth)
            // let username = accountInfo.username
            // if(!username) throw Error("unknown token! token: "+authorization)
            log.debug(tag,"accountInfo: ",accountInfo)

            //if valid give terminal history
            let terminalInfo = await terminalsDB.findOne({terminalName})
            log.debug(tag,"terminalInfo: ",terminalInfo)
            output.terminalInfo = terminalInfo

            //get last txs

            //get cap table

            //get sessions:
            let sessions = await sessionsDB.find({terminalName})
            output.sessions = sessions

            return output
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //Submit review
    @Post('/bankless/driver/submit')
    //CreateAppBody
    public async submitDriver(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | submitDriver | "
        try{
            let output:any = {}
            log.info(tag,"body: ",body)
            log.info(tag,"authorization: ",authorization)

            //get bankless auth info
            let banklessAuth = await redis.hgetall("bankless:auth:"+authorization)
            log.debug(tag,"banklessAuth: ",banklessAuth)

            //location of driver
            //area of coverage
            let entry = {
                pubkey:body.pubkey,
                created: new Date().getTime(),
                location:body.location
            }
            let saveDb = await driversDB.insert(entry)
            output.success = true
            output.saveDb = saveDb


            return(output);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }


    //startSession
    @Post('/bankless/driver/update')
    //CreateAppBody
    public async updateDriver(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | updateDriver | "
        try{
            log.debug(tag,"body: ",body)
            log.debug(tag,"authorization: ",authorization)
            // if(!body.signer) throw Error("invalid signed payload missing signer!")
            // if(!body.payload) throw Error("invalid signed payload missing payload!")
            // if(!body.signature) throw Error("invalid signed payload missing !")
            // if(!body.nonce) throw Error("invalid signed payload missing !")
            let driverId  = body.driverId

            //@TODO update auth
            //must be lp add or remove
            //must be terminal add or remove

            //publisher.publish('bankless', JSON.stringify({type:"rate",payload:{terminalName, rate, TOTAL_CASH, TOTAL_DAI}}))

            let terminalInfo = await driversDB.update(
                { driverId },
                { $set: { location } }
            );

            //get public tx history
            let txHistory = await banklessTxDB.find({driverId})
            terminalInfo.txHistory = txHistory
            return(terminalInfo);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //Submit review
    @Post('/bankless/terminal/submit')
    //CreateAppBody
    public async submitTerminal(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | submitTerminal | "
        try{
            log.debug(tag,"body: ",body)
            log.debug(tag,"authorization: ",authorization)
            // if(!body.signer) throw Error("invalid signed payload missing signer!")
            // if(!body.payload) throw Error("invalid signed payload missing payload!")
            // if(!body.signature) throw Error("invalid signed payload missing !")
            if(!body.terminalName) throw Error("invalid terminalName missing !")
            if(!body.rate) throw Error("invalid rate missing !")
            if(!body.pubkey) throw Error("invalid pubkey missing !")
            if(!body.TOTAL_CASH) throw Error("invalid TOTAL_CASH missing !")
            if(!body.TOTAL_DAI) throw Error("invalid TOTAL_DAI missing !")
            if(!body.location) throw Error("invalid location missing !")
            if(!body.captable) throw Error("invalid captable missing !")

            let output:any = {}

            //get bankless auth info
            let banklessAuth = await redis.hgetall("bankless:auth:"+authorization)
            log.debug(tag,"banklessAuth: ",banklessAuth)


            if(Object.keys(banklessAuth).length === 0) {
                //new terminal
            }
            let entry = {
                terminalId:body.terminalId,
                terminalName:body.terminalName,
                tradePair: body.tradePair,
                rate: body.rate,
                pubkey:body.pubkey,
                TOTAL_CASH:body.TOTAL_CASH,
                TOTAL_DAI:body.TOTAL_DAI,
                captable:body.captable,
                fact:"",
                location:body.location
            }
            let saveDb = await terminalsDB.insert(entry)
            log.debug(tag,"saveDb: ",saveDb)
            output.success = true
            output.saveDb = saveDb
            //start session
            let session = {
                terminalName:entry.terminalName,
                type:"onStart",
                action:"start device",
                sessionId:body.sessionId,
                location:body.location,
                rate:entry.rate,
                TOTAL_CASH:entry.TOTAL_CASH,
                TOTAL_DAI:entry.TOTAL_DAI,
                start: new Date()
            }
            sessionsDB.insert(session)
            output.sessionId = session.sessionId

            //txs history


            return(output);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    @Post('/bankless/terminal/captable/update')
    //CreateAppBody
    public async updateTerminalCaptable(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | updateTerminalCaptable | "
        try{
            log.debug(tag,"body: ",body)
            log.debug(tag,"authorization: ",authorization)
            // if(!body.signer) throw Error("invalid signed payload missing signer!")
            // if(!body.payload) throw Error("invalid signed payload missing payload!")
            // if(!body.signature) throw Error("invalid signed payload missing !")
            // if(!body.nonce) throw Error("invalid signed payload missing !")
            //@TODO update auth
            //must be lp add or remove
            //must be terminal add or remove
            let captable = body.captable
            let terminalName = body.terminalName

            let terminalInfo = await terminalsDB.update(
                { terminalName },
                { $set: { captable } }
            );

            return(terminalInfo);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //startSession
    @Post('/bankless/terminal/update')
    //CreateAppBody
    public async updateTerminal(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | updateTerminal | "
        try{
            log.debug(tag,"body: ",body)
            log.debug(tag,"authorization: ",authorization)
            // if(!body.signer) throw Error("invalid signed payload missing signer!")
            // if(!body.payload) throw Error("invalid signed payload missing payload!")
            // if(!body.signature) throw Error("invalid signed payload missing !")
            // if(!body.nonce) throw Error("invalid signed payload missing !")
            if(!body.terminalName) throw Error("invalid terminalName missing !")
            if(!body.rate) throw Error("invalid rate missing !")
            if(!body.pubkey) throw Error("invalid pubkey missing !")
            if(!body.TOTAL_CASH) throw Error("invalid TOTAL_CASH missing !")
            if(!body.TOTAL_DAI) throw Error("invalid TOTAL_DAI missing !")
            if(!body.location) throw Error("invalid location missing !")
            if(!body.captable) throw Error("invalid captable missing !")

            //@TODO update auth
            //must be lp add or remove
            //must be terminal add or remove
            let captable = body.captable
            let location = body.location
            let terminalName = body.terminalName
            let rate = body.lastRate
            let TOTAL_CASH = body.TOTAL_CASH
            let TOTAL_DAI = body.TOTAL_DAI

            publisher.publish('bankless', JSON.stringify({type:"rate",payload:{terminalName, rate, TOTAL_CASH, TOTAL_DAI}}))

            let terminalInfo = await terminalsDB.update(
                { terminalName },
                { $set: { location, rate, TOTAL_CASH, TOTAL_DAI, captable } }
            );

            //start session
            // let session = {
            //     terminalName,
            //     location,
            //     rate,
            //     TOTAL_CASH,
            //     TOTAL_DAI,
            //     start: new Date(),
            //     sessionId: "session:"+uuidv4()
            // }
            // sessionsDB.insert(session)
            // terminalInfo.sessionId = session.sessionId

            //get public tx history
            let txHistory = await banklessTxDB.find({terminalName})
            terminalInfo.txHistory = txHistory
            return(terminalInfo);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //startSession
    @Post('/bankless/order/submit')
    //CreateAppBody
    public async submitOrder(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | submitOrder | "
        try{
            log.info(tag,"body: ",body)
            log.info(tag,"authorization: ",authorization)
            let online = await redis.smembers('online')
            log.info(tag,"online: ",online)

            let session = {
                id:uuidv4(),
                market:"USD_USDC",
                user:body.user,
                amount:body.amount,
                amountOutMin:body.amountOutMin,
            }
            let result = await ordersDB.insert(session)

            //get terminal
            let terminals = await terminalsDB.find()
            console.log("get terminal: ",terminals)
            let onlineTerminals = terminals.filter(terminal => online.includes(terminal.terminalName));
            console.log("Online terminals: ", onlineTerminals);
            // if(!onlineTerminals.length) throw Error("no online terminals!")

            //is terminal online

            //get driver
            let drivers = await driversDB.find()
            console.log("get driver: ",drivers)

            //is online?
            let onlineDrivers = drivers.filter(driver => {
                let driverId = "driver:" + driver.pubkey; // Ensure this matches the format in the `online` array
                return online.includes(driverId);
            });
            console.log("Online drivers: ", onlineDrivers);

            //is within 100 miles
            let calculateDistance = function(p1, p2) {
                const toRadians = degree => degree * (Math.PI / 180);

                const earthRadiusMiles = 3958.8; // Radius of the Earth in miles

                const lat1Radians = toRadians(p1.lat);
                const lat2Radians = toRadians(p2.lat);
                const deltaLatRadians = toRadians(p2.lat - p1.lat);
                const deltaLngRadians = toRadians(p2.lng - p1.lng);

                const a =
                    Math.sin(deltaLatRadians / 2) * Math.sin(deltaLatRadians / 2) +
                    Math.cos(lat1Radians) *
                    Math.cos(lat2Radians) *
                    Math.sin(deltaLngRadians / 2) *
                    Math.sin(deltaLngRadians / 2);

                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return earthRadiusMiles * c;
            }

            //build all permutations of drivers and terminals
            const combinations = [];
            onlineTerminals.forEach(terminal => {
                onlineDrivers.forEach(driver => {
                    const distance = calculateDistance({lat: terminal.lat, lng: terminal.lng}, {lat: driver.lat, lng: driver.lng});
                    combinations.push({terminal, driver, distance});
                });
            });

            // Step 3: Sort combinations by distance to find the nearest match
            combinations.sort((a, b) => a.distance - b.distance);

            // Assuming you want at least one match
            if (combinations.length > 0) {
                const nearestMatch = combinations[0]; // This is the nearest terminal-driver pair
                // Proceed with creating and publishing the match event
                let match = {
                    id: uuidv4(),
                    terminal: nearestMatch.terminal.terminalName || "sampleTerminal",
                    driverId: "driver:" + nearestMatch.driver.pubkey,
                    session,
                    "event": "match",
                    "type": "order",
                    driver: nearestMatch.driver.name, // Assuming the driver object has a name property
                    mm: "",
                    "timestamp": new Date(),
                    status: "start",
                    complete: false
                };
                publisher.publish('match', JSON.stringify(match));

                console.log("Nearest match found and published");
                // Assuming result is the outcome you want to return
            } else {
                console.log("No matches found");
                // Handle the case where no matches are found
            }
            return result;
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //startSession
    @Post('/bankless/terminal/event')
    //CreateAppBody
    public async pushEvent(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | pushEvent | "
        try{
            log.debug(tag,"body: ",body)
            log.debug(tag,"authorization: ",authorization)
            // if(!body.signer) throw Error("invalid signed payload missing signer!")
            // if(!body.payload) throw Error("invalid signed payload missing payload!")
            // if(!body.signature) throw Error("invalid signed payload missing !")
            // if(!body.nonce) throw Error("invalid signed payload missing !")

            //must be lp add or remove
            if(!body.type) throw Error("invalid type!")
            if(!body.event) throw Error("invalid event!")
            if(!body.terminalName) throw Error("invalid type!")

            let session = {
                terminalName:body.terminalName,
                type:body.type,
                event:body.event,
                sessionId:body.sessionId,
                location:body.location,
                rate:body.rate,
                TOTAL_CASH:body.TOTAL_CASH,
                TOTAL_DAI:body.TOTAL_DAI,
            }
            let result = await sessionsDB.insert(session)

            log.debug(tag,"result: ",result)
            return(result);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }

    //startSession
    @Post('/bankless/terminal/startSession')
    //CreateAppBody
    public async startSession(@Header('Authorization') authorization: string,@Body() body: any): Promise<any> {
        let tag = TAG + " | startSession | "
        try{
            log.debug(tag,"body: ",body)
            log.debug(tag,"authorization: ",authorization)
            // if(!body.signer) throw Error("invalid signed payload missing signer!")
            // if(!body.payload) throw Error("invalid signed payload missing payload!")
            // if(!body.signature) throw Error("invalid signed payload missing !")
            // if(!body.nonce) throw Error("invalid signed payload missing !")

            //must be lp add or remove
            if(!body.type) throw Error("invalid type!")
            if(!body.address) throw Error("invalid required address!")
            if(!body.terminalName) throw Error("invalid required terminalName!")

            //create an actionId
            let actionId = "action:"+uuidv4()
            body.actionId = actionId
            publisher.publish('bankless', JSON.stringify({type:"terminal",payload:body}))

            //wait for session to be created
            let resultCreate = await redisQueue.blpop(actionId, 30);
            log.debug(tag,"resultCreate: ",resultCreate)
            log.debug(tag,"resultCreate: ",resultCreate[1])
            log.debug(tag,"resultCreate: ",typeof(resultCreate[1]))
            log.debug(tag,"resultCreate: ",JSON.parse(resultCreate[1]))
            //current rate
            let result = JSON.parse(resultCreate[1])
            log.debug(tag,"result: ",result)
            return(result);
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }


}
