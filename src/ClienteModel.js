const mongoose = require("mongoose");

const Clientes = new mongoose.Schema({
  uuid: { type: Number },

  name: { type: String },

  activo: { type: Number },

  edad: { type: Number },
});

module.exports = mongoose.model("clientes", Clientes);
