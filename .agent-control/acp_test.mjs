import net from "node:net";

const socket = net.createConnection(
  { host: "127.0.0.1", port: 4097 },
  () => {
    console.log("CONNECTED");

    const msg = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: 1,
        clientCapabilities: {},
        clientInfo: {
          name: "WEB-FACTOR-TEST",
          version: "1.0"
        }
      }
    };

    socket.write(JSON.stringify(msg) + "\n");
  }
);

socket.on("data", data => {
  console.log("ACP RESPONSE:");
  console.log(data.toString());
  socket.end();
});

socket.on("error", err => {
  console.error("ACP ERROR:", err.message);
});

socket.on("close", () => {
  console.log("CONNECTION CLOSED");
});
