import { researchGraph } from "./src/agents/graph";
async function main() {
  try {
    console.log("Invoking graph...");
    const res = await researchGraph.invoke({ ticker: "NVIDIA", horizon: "long", riskProfile: "medium", logs: [] });
    console.log("Graph success!");
    console.log(res.logs.slice(-3));
  } catch (e) {
    console.error("Graph Error:", e);
  }
}
main();
