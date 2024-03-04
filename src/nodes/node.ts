import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value, NodeState } from "../types";
import {delay} from "../utils";

export async function node(
  nodeId: number, // the ID of the node
  N: number, // total number of nodes in the network
  F: number, // number of faulty nodes in the network
  initialValue: Value, // initial value of the node
  isFaulty: boolean, // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // used to know if all nodes are ready to receive requests
  setNodeIsReady: (index: number) => void // this should be called when the node is started and ready to receive requests
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  let currentNodeState: NodeState = {
    killed: isFaulty,
    x: initialValue,
    decided: false,
    k: null,
  };

  let proposals: Map<number, Value[]> = new Map();


  // TODO implement this
  // this route allows retrieving the current status of the node
  node.get("/status", (req, res) => {
    // this route should respond with a 500 status and the message faulty if the node is faulty and respond with a 200 status and the message live if the node is not faulty. When a node is faulty, x, decided and k are set to null
    // check if the node is faulty
    if (isFaulty) {
      return res.status(500).send("faulty");
    }
    return res.status(200).send("live");
  });

  // TODO implement this
  // this route allows the node to receive messages from other nodes
  node.post("/message", (req, res) => {
    let { k, x, messageType } = req.body;
    proposals.set(k, x);

  });

  // TODO implement this
  // this route is used to start the consensus algorithm
  node.get("/start", async (req, res) => {
    while(!nodesAreReady()) {
      await delay(50);
    }

    currentNodeState.k = 1;
    for (let i = 0; i < N; i++) {
      await fetch(`http://localhost:${BASE_NODE_PORT + i}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          k: currentNodeState.k,
          x: currentNodeState.x,
          messageType: "propose",
        }),
      });
    }
  });

  // TODO implement this
  // this route is used to stop the consensus algorithm
  node.get("/stop", async (req, res) => {
    isFaulty = true;
    res.status(200).send("stopped");
  });

  // TODO implement this
  // get the current state of a node
  node.get("/getState", (req, res) => {

    return res.status(200).send(currentNodeState);
  });

  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
}
