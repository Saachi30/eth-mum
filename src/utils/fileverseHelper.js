import axios from 'axios';

// Based on your terminal output, the local server is on 8001
const FILEVERSE_API_URL = 'http://localhost:8001';
const API_KEY = "9R9YzHgy0Sni4nL7dSQBjbmJkGgP4QjP";

/**
 * Polls the Fileverse API until the document is synced
 * @param {string} ddocId 
 * @returns {Promise<string>} - The shareable link
 */
const waitForSync = async (ddocId) => {
    for (let i = 0; i < 20; i++) {
        try {
            const res = await axios.get(`${FILEVERSE_API_URL}/api/ddocs/${ddocId}?apiKey=${API_KEY}`);
            // Check if the document is synced and has a link
            if (res.data && res.data.link) {
                return res.data.link;
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
        await new Promise(r => setTimeout(r, 3000)); // wait 3 seconds
    }
    return `https://ddocs.fileverse.io/d/${ddocId}`; // Fallback to ID link
};

/**
 * Uploads receipt metadata to the local Fileverse API
 * @param {Object} metadata - The receipt data to store
 * @returns {Promise<string>} - The ddocId
 */
export const uploadToFileverse = async (metadata) => {
    try {
        const response = await axios.post(`${FILEVERSE_API_URL}/api/ddocs?apiKey=${API_KEY}`, {
            content: JSON.stringify(metadata),
            title: `REC Trade Receipt - ${Date.now()}`
        });

        if (response.data && response.data.data && response.data.data.ddocId) {
            return response.data.data.ddocId;
        }
        
        throw new Error("Invalid response from Fileverse API");
    } catch (error) {
        console.error("Fileverse Upload Error:", error);
        return null;
    }
};

/**
 * Uploads raw text/markdown file to the local Fileverse API
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} - The shareable link
 */
export const uploadRawFileToFileverse = async (file) => {
    try {
        const content = await file.text();
        // The local API uses /api/ddocs with apiKey in query
        const response = await axios.post(`${FILEVERSE_API_URL}/api/ddocs?apiKey=${API_KEY}`, {
            content: content,
            title: file.name
        });

        if (response.data && response.data.data && response.data.data.ddocId) {
            const ddocId = response.data.data.ddocId;
            // Wait for sync to get the actual public link
            return await waitForSync(ddocId);
        }
        
        throw new Error("Invalid response from Fileverse API");
    } catch (error) {
        console.error("Fileverse Raw File Upload Error:", error);
        return null;
    }
};

/**
 * Uploads a raw markdown string to the local Fileverse API
 * @param {string} content - The markdown text content
 * @param {string} title - The document title / filename
 * @returns {Promise<string|null>} - The ddocId (to be converted to bytes32)
 */
export const uploadMarkdownContent = async (content, title) => {
    try {
        const response = await axios.post(`${FILEVERSE_API_URL}/api/ddocs?apiKey=${API_KEY}`, {
            content,
            title,
        });

        if (response.data && response.data.data && response.data.data.ddocId) {
            return response.data.data.ddocId;
        }

        throw new Error("Invalid response from Fileverse API");
    } catch (error) {
        console.error("Fileverse Markdown Upload Error:", error);
        return null;
    }
};

/**
 * Gets the URL to view a Fileverse document
 * @param {string} identifier - The ddocId or full link
 * @returns {string}
 */
export const getFileverseUrl = (identifier) => {
    if (!identifier) return null;
    if (identifier.startsWith('http')) return identifier;
    return `https://ddocs.fileverse.io/d/${identifier}`;
};
