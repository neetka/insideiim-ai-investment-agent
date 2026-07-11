import yahooFinance from "yahoo-finance2";
const yf = new yahooFinance();
console.log(await yf.quote("AAPL"));
