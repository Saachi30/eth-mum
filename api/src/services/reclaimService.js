const { ReclaimProofRequest } = require('@reclaimprotocol/js-sdk');

const APP_ID = process.env.RECLAIM_APP_ID || '0x0f2285d3b3B904Cef3e4292cfE1A2141C5D20Dd9';
const APP_SECRET = process.env.RECLAIM_APP_SECRET || '0x34c8de06dd966c9117f7ddc118621b962476275bc8d357d75ff5269649a40ea6';
const PROVIDER_ID = process.env.RECLAIM_PROVIDER_ID || 'ce973302-0c9c-4216-8f0c-411ab4e47c42';

// Store sessions in memory (simple implementation)
const sessions = new Map();

const initializeVerification = async (url) => {
    const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID, {
        url: url,
    });

    const requestUrl = await reclaimProofRequest.getRequestUrl();
    const sessionId = reclaimProofRequest.sessionId;

    sessions.set(sessionId, {
        request: reclaimProofRequest,
        status: 'pending',
        proofs: null
    });

    // Start session in background
    reclaimProofRequest.startSession({
        onSuccess: (verificationProofs) => {
            const sess = sessions.get(sessionId);
            if (sess) {
                sess.status = 'success';
                sess.proofs = verificationProofs;
            }
        },
        onError: (error) => {
            const sess = sessions.get(sessionId);
            if (sess) {
                sess.status = 'error';
                sess.error = error.message;
            }
        },
    });

    return { requestUrl, sessionId };
};

const getSessionStatus = (sessionId) => {
    return sessions.get(sessionId);
};

module.exports = {
    initializeVerification,
    getSessionStatus
};
