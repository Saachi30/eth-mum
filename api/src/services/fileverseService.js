const axios = require('axios');

const FILEVERSE_API_URL = process.env.FILEVERSE_API_URL || 'http://localhost:5050';

const uploadMetadata = async (metadata) => {
    try {
        const response = await axios.post(`${FILEVERSE_API_URL}/create`, {
            content: JSON.stringify(metadata),
            title: `REC Trade Receipt - ${Date.now()}`,
            mimeType: 'application/json'
        });

        if (response.data && response.data.hash) {
            return response.data.hash;
        }
        
        throw new Error("Invalid response from Fileverse API");
    } catch (error) {
        console.error("Fileverse Upload Error:", error.message);
        // Return null or handle fallback if Fileverse API is not available
        return null;
    }
};

const getDocUrl = (hash) => {
    if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return null;
    }
    return `https://ddocs.fileverse.io/d/${hash}`;
};

module.exports = {
    uploadMetadata,
    getDocUrl
};
