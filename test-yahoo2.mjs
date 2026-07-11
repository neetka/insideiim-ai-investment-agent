import yahooFinance from "yahoo-finance2";
try {
  await yahooFinance.quote("AAPL");
} catch(e) {
  console.log(e);
}
