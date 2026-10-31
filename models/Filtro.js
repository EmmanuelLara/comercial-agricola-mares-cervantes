const mongoose = require('mongoose');

const FiltroSchema = new mongoose.Schema({
    Nombre_Maquina: { type: String, required: true },
    Numero: { type: String, required: true },
    Numero_Original: { type: String },
    Nombre_Filtro: { type: String, required: true }
});

module.exports = mongoose.model('Filtro', FiltroSchema);
