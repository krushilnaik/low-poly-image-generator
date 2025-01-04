const express = require("express");
const getPokegons = require("./script");

const app = express();

app.get("/generate/:id", (req, res) => {
  const id = req.params.id;
  const path = `pokemon/${id}.png`;

  getPokegons(path).then((data) => {
    res.send(data);
  });
});

app.listen(3030);
console.log("Express app started on port 3030");
