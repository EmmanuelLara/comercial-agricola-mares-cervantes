const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB para seed...');

        const adminExists = await Usuario.findOne({ Usuario: 'admin' });
        if (adminExists) {
            console.log('El usuario admin ya existe.');
        } else {
            const admin = new Usuario({
                Matricula_Usuario: 'ADM-001',
                Nombre_completo: 'Administrador Sistema',
                Usuario: 'admin',
                Clave: 'admin123',
                Rol: 'Administrador'
            });
            await admin.save();
            console.log('Usuario administrador creado con éxito:');
            console.log('Usuario: admin');
            console.log('Clave: admin123');
        }
    } catch (err) {
        console.error('Error en seed:', err);
    } finally {
        mongoose.disconnect();
    }
};

seedAdmin();
