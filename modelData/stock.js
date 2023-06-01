"use strict";

(function () {
    const TWTR = {
        date: "Thu Nov 07 2013 00:00:00 GMT-0500 (EST)",
        open: 45.1,
        high: 50.09,
        low: 44,
        close: 44.9,
        volume: 117701700,
        adjClose: 44.9,
        symbol: 'TWTR'
    }

    stocks = [TWTR];

    const stockTestModel = function () {
        return stocks;
    }

    const stocksModels = {
        stockModel: stockTestModel
    }

    if (typeof exports !== "undefined") {
        // We're being loaded by the Node.js module loader ('require') so we use its
        // conventions of returning the object in exports.
        exports.stockModels = stocksModels;
    } else {
        // We're not in the Node.js module loader so we assume we're being loaded by
        // the browser into the DOM.
        window.cs142models = stocksModels;
    }
}
)