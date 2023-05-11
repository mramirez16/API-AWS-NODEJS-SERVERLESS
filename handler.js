"use strict";
const ClienteModel = require("./src/ClienteModel");
const PedidosModel = require("./src/PedidosModel");
require("./src/DB");

module.exports.readAllandReadFilterPaginate = async (event) => {
  try {
    let body = JSON.parse(event.body);
    let filtroTablaCliente,
      filtroTablaPedidos = {};
    let aggregate = [];
    let matchPedidos = {};
    let matchClientes = {};
    if (!body) {
      throw new Error("Invalid Body");
    } else {
      if (!body.page) {
        body.page = 1;
      }
      if (!body.itemsPage) {
        body.itemsPage = 10;
      }
      if (!body.sort) {
        body.sort = {
          name: 1,
        };
      }
      if (!body.filters) {
        body.filters = [];
      } else {
        for (let i = 0; i < body.filters.length; i++) {
          filtroTablaCliente = body.filters[i];
          matchClientes = {
            name: filtroTablaCliente.name,
            edad: filtroTablaCliente.edad,
          };
          if (filtroTablaCliente.hasOwnProperty("pedidos")) {
            for (let j = 0; j < filtroTablaCliente.pedidos.length; j++) {
              const elemento = filtroTablaCliente.pedidos[j];
              filtroTablaPedidos = elemento.producto;
            }
            matchPedidos = {
              $and: [{ producto: filtroTablaPedidos }],
            };
          }
        }
      }
    }
    aggregate = [
      {
        $match: matchClientes,
      },
      {
        $lookup: {
          from: "pedidos",
          localField: "uuid",
          foreignField: "uuidCliente",
          as: "cp",
          pipeline: [
            {
              $match: matchPedidos,
            },
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
        $sort: body.sort,
      },
    ];
    const agreggateCliente = ClienteModel.aggregate(aggregate);
    const data = await ClienteModel.aggregatePaginate(agreggateCliente, {
      page: body.page,
      limit: body.itemsPage,
    })
      .then((results) => {
        return results;
      })
      .catch((err) => {
        console.error(err);
      });

    const resultadoArray = [];

    data.docs.forEach((registro) => {
      const doc = {
        name: registro.name,
        activo: registro.activo,
        edad: registro.edad,
        uuid: registro.uuid,
        cp: registro.cp,
      };
      resultadoArray.push(doc);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        page: data.page,
        totalPages: data.totalPages,
        itemsPage: data.limit,
        totalItems: data.totalDocs,
        list: resultadoArray,
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
            await PedidosModel.updateOne(
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
