import { useState } from 'react';
import QRCode from 'react-qr-code';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

const ReclaimURLVerifier = () => {
  const [url, setUrl] = useState('');
  const [requestUrl, setRequestUrl] = useState('');
  const [proofs, setProofs] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatProofData = (proof) => {
    try {
      const parameters = proof.parameters ? JSON.parse(proof.parameters) : {};
      return { ...proof, parameters };
    } catch (err) {
      return proof;
    }
  };

  const ProofDisplay = ({ proof }) => {
    const formattedProof = formatProofData(proof);
    
    return (
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Proof Details</h4>
          <p className="text-sm text-gray-600">Provider: {formattedProof.provider}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Identifier:</span>
            <p className="mt-1">{formattedProof.identifier}</p>
          </div>
          
          {formattedProof.ownerPublicKey && (
            <div>
              <span className="text-sm font-medium text-gray-700">Owner Public Key:</span>
              <code className="mt-1 block p-3 bg-gray-50 rounded-lg text-sm break-all font-mono">
                {formattedProof.ownerPublicKey}
              </code>
            </div>
          )}
          
          {formattedProof.parameters && (
            <div>
              <span className="text-sm font-medium text-gray-700">Parameters:</span>
              <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(formattedProof.parameters, null, 2)}
              </pre>
            </div>
          )}
          
          {formattedProof.signatures && (
            <div>
              <span className="text-sm font-medium text-gray-700">Signatures:</span>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg space-y-3">
                {formattedProof.signatures.map((sig, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">Type: {sig.type}</div>
                    <div className="break-all mt-1 font-mono">{sig.signature}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {formattedProof.context && (
            <div>
              <span className="text-sm font-medium text-gray-700">Context:</span>
              <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(formattedProof.context, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const verifyURL = async () => {
    if (!url) {
      setError('Please enter a URL to verify');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const APP_ID = '0x0f2285d3b3B904Cef3e4292cfE1A2141C5D20Dd9';
      const APP_SECRET = '0x34c8de06dd966c9117f7ddc118621b962476275bc8d357d75ff5269649a40ea6';
      const PROVIDER_ID = 'ce973302-0c9c-4216-8f0c-411ab4e47c42';

      const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID, {
        url: url,
      });

      const reqUrl = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(reqUrl);

      await reclaimProofRequest.startSession({
        onSuccess: (verificationProofs) => {
          setProofs(verificationProofs);
          setIsLoading(false);
        },
        onError: (error) => {
          setError('Verification failed: ' + error.message);
          setIsLoading(false);
        },
      });
    } catch (err) {
      setError('Error setting up verification: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="p-8 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">URL Verification (ZK Proof)</h2>
        <p className="mt-1 text-sm text-gray-600">Enter a URL to verify using Reclaim Protocol as a Zero Knowledge Proof</p>
      </div>
      
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              URL to Verify
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <button
            onClick={verifyURL}
            disabled={isLoading}
            className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : (
              'Verify URL'
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {requestUrl && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Scan QR Code to Verify</h3>
            </div>
            <div className="p-6 flex justify-center">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <QRCode value={requestUrl} />
              </div>
            </div>
          </div>
        )}

        {proofs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Verification Results</h3>
            {proofs.map((proof, index) => (
              <ProofDisplay key={index} proof={proof} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReclaimURLVerifier;