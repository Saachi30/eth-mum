require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`
🚀 REC Marketplace API is running!
📡 Port: ${PORT}
🔗 Local: http://localhost:${PORT}/api
        `);
    });
}

module.exports = app; // For Vercel
