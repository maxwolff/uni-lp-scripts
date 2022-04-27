import express from "express";
import { ethers } from "ethers";
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World - here an Express project with TS");
});

app.listen(8000, () => {
  console.log("The application is listening on port 3000!");
});

app.post("/positions", (req, res) => {});
