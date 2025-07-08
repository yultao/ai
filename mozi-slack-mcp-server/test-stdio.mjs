console.error("Start reading stdin");
process.stdin.on("data", (chunk) => {
  console.error("Received input:", chunk.toString());
  process.stdout.write(
    JSON.stringify({ content: [{ type: "text", text: "Echo: " + chunk.toString() }] }) +
      "\n"
  );
});