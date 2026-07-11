import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
const results = await yf.search("NVIDIA");
console.log(JSON.stringify(results.quotes.slice(0, 2), null, 2));
