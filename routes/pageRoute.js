const express = require('express');
const pageRouter = express.Router();

pageRouter.get('/login', (req, res) => {
  res.render('login');
});
pageRouter.get("/config", (req, res) => {
  res.render("config");
});

module.exports = pageRouter;
