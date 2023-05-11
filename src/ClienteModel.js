const mongoose = require("mongoose");
const mongoosePaaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Clientes = new mongoose.Schema({
  uuid: { type: Number },

  name: { type: String },

  activo: { type: Number },

  edad: { type: Number },
});

Clientes.plugin(mongoosePaaginate);
Clientes.plugin(aggregatePaginate);

module.exports = mongoose.model("clientes", Clientes);
