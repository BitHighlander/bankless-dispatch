/*
      ETH-tx ingester

      Registered intake


      *  Mempool txs


 */
import assert from "assert";

require('dotenv').config()
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"../../../../.env"})
require('dotenv').config({path:"../../../../../.env"})

const TAG = " | order matcher | "
const log = require('@pioneer-platform/loggerdog')()
// @ts-ignore
import { AssetValue, formatBigIntToSafeValue, isGasAsset } from '@coinmasters/core';
// const {subscriber,publisher,redis} = require('@pioneer-platform/default-redis')
const pjson = require('../package.json');

// @ts-ignore
import {getPaths} from "@pioneer-platform/pioneer-coins";
let queue = require("@pioneer-platform/redis-queue")

let SDK = require('@coinmasters/pioneer-sdk')
let spec = process.env['URL_PIONEER_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
let wss = process.env['URL_PIONEER_SOCKET'] || 'wss://pioneers.dev'

let WALLET_SEED=process.env['WALLET_SEED']
if(!WALLET_SEED) throw Error("Failed to load env vars! WALLET_SEED")

let do_work = async function(){
    let tag = TAG+" | do_work | "
    try{

        //sub for new orders

        //on order scan for matches


    } catch(e) {
        log.error(tag,"e: ",e)
        //queue.createWork(ASSET+":queue:block:ingest",block)
    }
    // do_work()
}



//start working on install
log.debug(TAG," worker started! ","")
do_work()
