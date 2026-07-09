import { StateGraph, START, END } from "@langchain/langgraph";
import { ResearchStateAnnotation } from "./state";
import { analystNode, researcherNode, deciderNode } from "./nodes";

// Define the StateGraph workflow
const workflow = new StateGraph(ResearchStateAnnotation)
  // Register the nodes
  .addNode("analyst", analystNode)
  .addNode("researcher", researcherNode)
  .addNode("decider", deciderNode)
  
  // Define execution edges
  // Running 'analyst' and 'researcher' in parallel to optimize API performance
  .addEdge(START, "analyst")
  .addEdge(START, "researcher")
  
  // Both analyst and researcher must complete before the decider compiles the recommendation
  .addEdge("analyst", "decider")
  .addEdge("researcher", "decider")
  
  // After decider finishes, the workflow is complete
  .addEdge("decider", END);

// Compile the workflow graph
export const researchGraph = workflow.compile();
export type ResearchGraphType = typeof researchGraph;
