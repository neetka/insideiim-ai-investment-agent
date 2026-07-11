import { getFinancialData } from "./src/tools/yahooFinance";
async function main() {
  try {
    const data = await getFinancialData("NVIDIA");
    console.log("SUCCESS");
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}
main();
