const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
require('dotenv').config();

const createPermanentAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Generador de Administrador ---');

        const adminData = {
            Matricula_Usuario: 'ADM-PRIMARY',
            Nombre_completo: 'Administrador Principal',
            Usuario: 'admin',
            Clave: 'admin123',
            Rol: 'Administrador'
        };

        const existingUser = await Usuario.findOne({ Usuario: adminData.Usuario });

        if (existingUser) {
            console.log(`El usuario "${adminData.Usuario}" ya existe. Actualizando contraseña...`);
            existingUser.Clave = adminData.Clave;
            existingUser.Rol = 'Administrador';
            await existingUser.save();
        } else {
            const newAdmin = new Usuario(adminData);
            await newAdmin.save();
            console.log('--- Administrador Creado con Éxito ---');
        }

        console.log(`Usuario: ${adminData.Usuario} | Clave: ${adminData.Clave}`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createPermanentAdmin();
