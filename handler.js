"use strict";
const ClienteModel = require("./src/ClienteModel");
const PedidosModel = require("./src/PedidosModel");
require("./src/DB");

module.exports.read = async (event) => {
  try {
    const data = await ClienteModel.aggregate([
      {
        $lookup: {
          from: "pedidos",
          localField: "uuid",
          foreignField: "uuidCliente",
          as: "cp",
          pipeline: [
            {
              $project: {
                _id: 0,
                __v: 0,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          activo: 1,
          edad: 1,
          cp: 1,
          uuid: 1,
        },
      },
      {
        $sort: {
          name: 1,
        },
      },
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: data,
        responseCode: 200,
        validations: [],
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: error.message,
      }),
    };
  }
};

module.exports.create = async (event) => {
  try {
    const body = JSON.parse(event.body);
    if (body) {
      const datosCliente = {
        name: body.name,
        activo: body.activo,
        edad: body.edad,
        uuid: body.uuid ? body.uuid : Math.floor(Math.random() * 90000) + 10000,
      };

      await ClienteModel.updateOne(
        { uuid: datosCliente.uuid },
        {
          $set: {
            name: datosCliente.name,
            edad: datosCliente.edad,
            activo: datosCliente.activo,
          },
        },
        { upsert: true }
      )
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err.message);
        });
      const datosPedidos = [];
      let existentes = [];
      for (let index = 0; index < body.pedidos.length; index++) {
        const element = body.pedidos[index];
        datosPedidos.push({
          uuidCliente: datosCliente.uuid,
          producto: element.producto,
          activo: element.activo,
          idProducto: element.idProducto
            ? element.idProducto
            : Math.floor(Math.random() * 90000) + 10000,
        });
        existentes = await PedidosModel.find({
          idProducto: datosPedidos[index].idProducto,
        })
          .then((res) => {
            console.log(res);
            return res;
          })
          .catch((err) => {
            console.log(err.message);
          });
        if (existentes.length > 0) {
          console.log("EXISTE " + JSON.stringify(existentes));
          if (existentes[index].idProducto === datosPedidos[index].idProducto) {
            console.log("ID PRODUCTO " + datosPedidos[index].idProducto);
            PedidosModel.updateOne(
              { idProducto: datosPedidos[index].idProducto },
              {
                $set: {
                  producto: datosPedidos[index].producto,
                  activo: datosPedidos[index].activo,
                },
              }
            )
              .then((res) => {
                console.log(res);
              })
              .catch((e) => {
                console.log(e);
              });
          } else {
            console.log(
              "CREADO CON ID IGUALES" + JSON.stringify(datosPedidos[index])
            );
            const pedidosGuardar = new PedidosModel(datosPedidos[index]);
            await pedidosGuardar.save();
          }
        } else {
          console.log("CREADO SIN REGISTROS EXISTENTES");
          const pedidosGuardar = new PedidosModel(datosPedidos[index]);
          await pedidosGuardar.save();
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          response: "ok",
          responseCode: 200,
          validations: [],
        }),
      };
    } else {
      throw new Error("Body requerido");
    }
  } catch (error) {
    console.log("Error: " + error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
      }),
      msgError: error.message,
    };
  }
};

module.exports.delete = async (event) => {
  try {
    const { id } = event.pathParameters;
    if (id) {
      const where = { uuid: id };
      await ClienteModel.remove(where)
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.log(error.message);
        });
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          response: "Success",
          responseCode: 200,
          validations: [],
        }),
      };
    } else {
      throw new Error("Id requerido");
    }
  } catch (error) {
    console.log("Error: " + error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
      }),
      msgError: error.message,
    };
  }
};

module.exports.filter = async (event) => {
  try {
    let body = JSON.parse(event.body);
    if (!body) {
      throw new Error("Empty body received");
    }

    if (!body.filters) {
      body.filters = [];
    }

    let result = [];
    let where,
      where2 = {};
    for (let index = 0; index < body.filters.length; index++) {
      where = body.filters[index];

      for (let i = 0; i < where.pedidos.length; i++) {
        const element = where.pedidos[i];
        where2 = element.producto;
      }
    }
    result = await ClienteModel.aggregate([
      {
        $match: { name: where.name, edad: where.edad },
      },
      {
        $lookup: {
          from: "pedidos",
          localField: "uuid",
          foreignField: "uuidCliente",
          as: "cp",
          pipeline: [
            {
              $match: {
                $and: [{ producto: where2 }],
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          activo: 1,
          edad: 1,
          cp: 1,
          uuid: 1,
        },
      },
    ])
      .then((res) => {
        console.log(res);
        return res;
      })
      .catch((err) => {
        console.log(err.message);
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: result,
        responseCode: 200,
        validations: [],
      }),
    };
  } catch (error) {
    console.log("Error: " + error);
    return {
      msgError: error.message,
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
        msgError: error.message,
      }),
    };
  }
};

/*module.exports.find = async (event) => {
  let response = [];
  try {
    response = await ClienteModel.find()
      .then((res) => {
        console.log(res);
        return res;
      })
      .catch((err) => {
        console.log(err);
      });
    return {
      msgError: null,
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: response,
        responseCode: 200,
      }),
    };
  } catch (error) {
    return {
      msgError: error,
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
        msgError: error,
      }),
    };
  }
};

module.exports.findByActive = async (event) => {
  let response = [];
  const where = { activo: 0 };
  try {
    response = await ClienteModel.find(where)
      .then((res) => {
        console.log(res);
        return res;
      })
      .catch((err) => {
        console.log(err);
      });
    return {
      msgError: null,
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: response,
        responseCode: 200,
      }),
    };
  } catch (error) {
    return {
      msgError: error,
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
        msgError: error,
      }),
    };
  }
};*/

/*module.exports.createTest = async (event) => {
  const objeto = {
    name: "TEST_TRES",
    edad: 20,
    activo: 0,
    uuid: 54321,
  };

  const query = new ClienteModel(objeto);
  try {
    await query.save();
    return {
      msgError: null,
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: "EXITO",
        responseCode: 200,
      }),
    };
  } catch (error) {
    console.log("Error: " + error);
    return {
      msgError: error,
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
        msgError: error,
      }),
    };
  }
};*/

/*module.exports.eliminar = async (event) => {
  const { uuid } = event.pathParameters;

  try {
    if (!uuid) {
      throw new Error("ID is required in URL");
    }
    const where = { uuid: uuid };
    await ClienteModel.remove(where)
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err.message);
      });
    return {
      msgError: null,
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: "EXITO",
        responseCode: 200,
      }),
    };
  } catch (error) {
    console.log("Error: " + error);
    return {
      msgError: error,
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
        msgError: error,
      }),
    };
  }
};*/

/*module.exports.actualizar = async (event) => {
  const { uuid } = event.pathParameters;
  const body = JSON.parse(event.body);

  try {
    if (!uuid) {
      throw new Error("ID is required in URL");
    }
    if (!body) {
      throw new Error("BODY is required");
    }
    const where = { uuid: uuid };
    await ClienteModel.updateOne(where, {
      $set: {
        name: body.name,
        edad: body.edad,
        activo: body.activo,
      },
      
    },
    {
      upsert: true
    })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err.message);
      });
    return {
      msgError: null,
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: "EXITO",
        responseCode: 200,
      }),
    };
  } catch (error) {
    console.log("Error: " + error);
    return {
      msgError: error,
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        response: null,
        responseCode: 500,
        validations: [],
        msgError: error,
      }),
    };
  }
};*/
