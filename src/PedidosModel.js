const mongoose = require("mongoose");

const Pedidos = new mongoose.Schema(
  {
    uuidCliente: { type: Number },

    producto: { type: String },

    activo: { type: Number },

    idProducto: { type: Number },
  },
);

module.exports = mongoose.model("pedidos", Pedidos);
