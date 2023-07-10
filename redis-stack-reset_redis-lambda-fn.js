
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const redisClient = redis.createClient({
    host: process.env.ENDPOINT,
    port: parseInt(process.env.PORT || "6379"),
});

exports.chargeRequestRedis = async function (input) {
    var remainingBalance = await getBalanceRedis(KEY);
    var charges = getCharges();
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    remainingBalance = await chargeRedis(KEY, charges);
    return {
        remainingBalance,
        charges,
        isAuthorized,
    };
};

exports.resetRedis = async function () {
    const ret = new Promise((resolve, reject) => {
        redisClient.set(KEY, String(DEFAULT_BALANCE), (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(DEFAULT_BALANCE);
            }
        });
    });
    return ret;
};

async function getBalanceRedis(key) {
    return new Promise((resolve, reject) => {
        redisClient.get(key, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(Number(data));
            }
        });
    });
}

async function chargeRedis(key, charges) {
    return new Promise((resolve, reject) => {
        redisClient.decrby(key, charges, (err, result) => {
            if (err) {
                reject(err);
            } else {
                return resolve(Number(result));
            }
        });
    });
}

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}

function getCharges() {
    return DEFAULT_BALANCE / 20;
}