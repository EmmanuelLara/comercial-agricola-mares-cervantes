const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
    Matricula_Usuario: { type: String, required: true },
    Nombre_completo: { type: String, required: true },
    Usuario: { type: String, required: true, unique: true },
    Clave: { type: String, required: true },
    Rol: { type: String, enum: ['Jefe', 'Administrador', 'Vendedor'], default: 'Vendedor' }
});

// Hash password before saving
UsuarioSchema.pre('save', async function() {
    if (!this.isModified('Clave') || this.$locals?.skipPasswordHash) return;
    this.Clave = await bcrypt.hash(this.Clave, 10);
});


// Method to compare password
UsuarioSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.Clave);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
