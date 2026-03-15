import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import {
  FileText, Award, Upload, CheckCircle, Shield,
  ExternalLink, Download, X, ChevronRight, Loader2, AlertCircle, Info, Globe
} from 'lucide-react';
import { uploadMarkdownContent, getFileverseUrl } from '../utils/fileverseHelper';
import { useMQTTContext } from '../context/MQTTContext';
import { useAuth } from '../context/AuthContext';
import { syncActionToEns } from '../utils/ensHelper';

// ─── Document Generator: Buy/Sell Token Agreement ───────────────────────────
const generateAgreementMd = (listing, buyerAddress, buyAmount) => {
  const agreementId = uuidv4().slice(0, 8).toUpperCase();
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const total = Number(buyAmount) * Number(listing.price);
  const carbonCreditsEarned = Math.floor((Number(buyAmount) * Number(listing.creditRatio)) / 100);

  const content = `# Renewable Energy Certificate (REC) Purchase Agreement

**Agreement ID:** ${agreementId}
**Date:** ${date}
**Blockchain Network:** Ethereum Sepolia Testnet
**Smart Contract:** RECDominator

---

## Parties

| Role | Wallet Address |
|------|----------------|
| **Buyer** | \`${buyerAddress}\` |
| **Seller** | \`${listing.seller}\` |

---

## Asset Details

| Field | Value |
|-------|-------|
| Listing ID | #${listing.id} |
| Energy Source | ${listing.energyType} |
| Producer Location | ${listing.location || 'On-Chain Verified'} |
| Amount Traded | ${buyAmount} MWh |
| Price Per Token | ${listing.price} Credits |
| Total Cost | ${total} Credits |
| Carbon Credit Reward Ratio | ${listing.creditRatio}% |
| Carbon Credits to be Earned | ${carbonCreditsEarned} |

---

## Terms & Conditions

1. The **Buyer** (\`${buyerAddress}\`) agrees to purchase **${buyAmount} MWh** of **${listing.energyType}** Renewable Energy Certificates (RECs) from the **Seller** (\`${listing.seller}\`).

2. The total consideration for this transaction is **${total} dummy credits** to be debited from the Buyer's on-chain balance upon execution.

3. Upon successful execution, the Buyer is entitled to **${carbonCreditsEarned} Carbon Credits**, awarded proportionally at a reward ratio of **${listing.creditRatio}%** on the purchased quantity of **${buyAmount} MWh**.

4. This agreement is non-repudiable once the transaction is confirmed on the Ethereum blockchain.

5. The Seller certifies that the listed RECs originate from a verified renewable energy source of type **${listing.energyType}** located at **${listing.location || 'an on-chain verified location'}**.

6. By executing the \`buyTokens(id, ${buyAmount}, fdHash, ccHash)\` smart contract function, both parties irrevocably agree to the terms set forth in this document.

7. The cryptographic hash (bytes32) of this document, derived via keccak256 from the Fileverse ddocId, shall serve as the \`fdHash\` parameter in the on-chain transaction.

---

## Cryptographic Record

- **Document Storage:** Fileverse Decentralized Storage (IPFS-backed)
- **Hash Algorithm:** keccak256
- **Smart Contract Enforced:** RECDominator on Ethereum Sepolia
- **Immutable Timestamp:** Set upon blockchain confirmation

---

*This agreement is legally binding and cryptographically secured via the RECDominator smart contract on the Ethereum network.*`;

  return { id: agreementId, content };
};

// ─── Document Generator: Carbon Credit Certificate ───────────────────────────
const generateCertificateMd = (listing, buyerAddress, buyAmount) => {
  const certId = 'CC-' + uuidv4().slice(0, 8).toUpperCase();
  const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const carbonOffsetTons = (Number(buyAmount) * 0.82).toFixed(3);
  const carbonOffsetKg = (Number(carbonOffsetTons) * 1000).toFixed(0);
  const treesEquivalent = Math.ceil(Number(carbonOffsetTons) * 46);
  const homesEquivalent = Math.floor((Number(buyAmount) * 1000) / 877);
  const creditsEarned = Math.floor((Number(buyAmount) * Number(listing.creditRatio)) / 100);

  const content = `# Carbon Credit Certificate

**Certificate ID:** ${certId}
**Issued Date:** ${date}
**Issuing Entity:** RECDominator Smart Contract
**Blockchain Network:** Ethereum Sepolia Testnet
**Standard:** International REC Standard (I-REC)

---

## Certificate Holder

| Field | Value |
|-------|-------|
| Wallet Address | \`${buyerAddress}\` |
| Certificate ID | ${certId} |
| Listing Reference | #${listing.id} |
| Energy Type | ${listing.energyType} |

---

## Carbon Impact Metrics

| Metric | Value |
|--------|-------|
| Renewable Energy Purchased | ${buyAmount} MWh |
| Energy Source Type | ${listing.energyType} |
| Producer Location | ${listing.location || 'On-Chain Verified'} |
| Carbon Offset Equivalent | ~${carbonOffsetKg} kg CO₂ (~${carbonOffsetTons} metric tons) |
| Carbon Credit Reward Ratio | ${listing.creditRatio}% |
| **Carbon Credits Earned** | **${creditsEarned}** |

---

## Environmental Equivalence

Purchasing **${buyAmount} MWh** of **${listing.energyType}** renewable energy has contributed to:

- Reduction of approximately **${carbonOffsetKg} kg CO₂** from the atmosphere
- Equivalent to planting **${treesEquivalent} trees** and allowing them to grow for 10 years
- Equivalent to powering **${homesEquivalent} homes** for one year (avg. 877 kWh/month)

---

## Verification

This certificate is stored on Fileverse decentralized document infrastructure. The cryptographic hash of this document is immutably recorded on the Ethereum blockchain as the \`ccHash\` parameter in the \`buyTokens\` transaction, serving as irrefutable proof of carbon credit issuance.

| Field | Value |
|-------|-------|
| Storage Provider | Fileverse (IPFS-backed) |
| Hash Algorithm | keccak256 |
| Blockchain Parameter | \`ccHash\` in \`buyTokens\` |
| Compliance Standard | I-REC (International REC Standard) |

---

*This certificate is issued in compliance with Renewable Energy Certificate standards. It represents a verified, immutable proof of carbon offsetting and is non-transferable once recorded on-chain.*`;

  return { id: certId, content };
};

const mdToHtml = (md) => {
  let html = md;
  html = html.replace(/((\|.+\|\n)+)/g, (block) => {
    const rows = block.trim().split('\n');
    const tableRows = rows
      .filter(r => !r.match(/^\|[\s\-|:]+\|$/))
      .map((r, i) => {
        const cells = r.split('|').filter((_, idx) => idx > 0 && idx < r.split('|').length - 1);
        const tag = i === 0 ? 'th' : 'td';
        return `<tr>${cells.map(c => `<${tag}>${c.trim().replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</${tag}>`).join('')}</tr>`;
      })
      .join('\n');
    return `<table>${tableRows}</table>\n`;
  });
  html = html
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
    .replace(/\n{2,}/g, '<br/><br/>');
  return html;
};

const BuyContractModal = ({ listing, account, contract, onClose, onSuccess }) => {
  const { publish } = useMQTTContext();
  const { ensName } = useAuth();
  const [step, setStep] = useState(1);
  const [activeDoc, setActiveDoc] = useState('agreement');
  const [uploading, setUploading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [syncingEns, setSyncingEns] = useState(false);
  const [buyAmount, setBuyAmount] = useState(listing.amount);
  const [preflight, setPreflight] = useState({ loading: true, registered: false, approved: false, credits: '0' });
  const [fdHash, setFdHash] = useState(null);
  const [ccHash, setCcHash] = useState(null);
  const [fdUrl, setFdUrl] = useState(null);
  const [ccUrl, setCcUrl] = useState(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [certChecked, setCertChecked] = useState(false);
  const [finalConfirmed, setFinalConfirmed] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!contract || !account) return;
      try {
        const [buyerInfo, credits] = await Promise.all([
          contract.getBuyerInfo(account),
          contract.dummyCredits(account),
        ]);
        setPreflight({
          loading: false,
          registered: buyerInfo.registered,
          approved: buyerInfo.approved,
          credits: credits.toString(),
        });
      } catch (e) {
        console.error('Preflight check failed', e);
        setPreflight(prev => ({ ...prev, loading: false }));
      }
    };
    check();
  }, [contract, account]);

  const cost = Number(buyAmount) * Number(listing.price);
  const hasEnoughCredits = Number(preflight.credits) >= cost;
  const amountValid = Number(buyAmount) > 0 && Number(buyAmount) <= Number(listing.amount);

  const preflightErrors = [];
  if (!preflight.loading) {
    if (!preflight.registered) preflightErrors.push({ msg: 'You are not registered as a buyer.', fix: 'registerBuyer' });
    else if (!preflight.approved) preflightErrors.push({ msg: 'Your buyer account is not yet approved.', fix: 'waitApproval' });
    if (!amountValid) preflightErrors.push({ msg: `Amount must be between 1 and ${listing.amount} MWh.`, fix: 'amount' });
    else if (!hasEnoughCredits) preflightErrors.push({ msg: `Insufficient credits.`, fix: 'credits' });
  }

  const canProceedFromStep1 = agreementChecked && certChecked && preflightErrors.length === 0 && !preflight.loading;
  const agreement = useMemo(() => generateAgreementMd(listing, account, buyAmount), [listing, account, buyAmount]);
  const certificate = useMemo(() => generateCertificateMd(listing, account, buyAmount), [listing, account, buyAmount]);

  const downloadMd = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (content, title) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Georgia,serif;margin:48px;color:#0f172a;line-height:1.75;font-size:14px}h1{font-size:22px;color:#064e3b;border-bottom:3px solid #10b981;padding-bottom:8px;margin-bottom:20px}h2{font-size:16px;color:#1e293b;margin-top:28px;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px;page-break-inside:avoid}td,th{border:1px solid #cbd5e1;padding:8px 12px;text-align:left}th{background:#f0fdf4;font-weight:700}tr:nth-child(even) td{background:#f8fafc}code{background:#f1f5f9;padding:2px 5px;border-radius:3px;font-size:0.82em;font-family:monospace;word-break:break-all}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}li{margin:4px 0}strong{color:#0f172a}@media print{body{margin:20px}button{display:none}}</style></head><body>${mdToHtml(content)}</body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  const handleUploadToFileverse = async () => {
    setUploading(true);
    try {
      const fdDdocId = await uploadMarkdownContent(agreement.content, `REC_Agreement_${agreement.id}.md`);
      const ccDdocId = await uploadMarkdownContent(certificate.content, `CC_Certificate_${certificate.id}.md`);
      if (fdDdocId && ccDdocId) {
        setFdHash(ethers.utils.id(fdDdocId));
        setCcHash(ethers.utils.id(ccDdocId));
        setFdUrl(getFileverseUrl(fdDdocId));
        setCcUrl(getFileverseUrl(ccDdocId));
        toast.success('Both documents uploaded!');
      } else {
        const ts = Date.now();
        setFdHash(ethers.utils.id(`AGREEMENT_${agreement.id}_${ts}`));
        setCcHash(ethers.utils.id(`CERTIFICATE_${certificate.id}_${ts}`));
        toast.warning('Fileverse node offline — using fallback hashes.');
      }
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleExecute = async () => {
    if (!fdHash || !ccHash || !finalConfirmed) return;
    setExecuting(true);
    try {
      const tx = await contract.buyTokens(listing.id, buyAmount, fdHash, ccHash);
      toast.info('Waiting for confirmation…');
      await tx.wait();
      toast.success(`Purchase complete!`);

      // Background Sync to ENS
      if (ensName) {
        setSyncingEns(true);
        syncActionToEns(ensName, account, "buy_history", {
            type: "BUY",
            listingId: listing.id,
            amount: buyAmount.toString(),
            price: listing.price.toString(),
            energyType: listing.energyType,
            txHash: tx.hash
        }).then(() => {
            toast.success("Purchase history saved to ENS!");
        }).catch(err => {
            console.error("ENS sync failed:", err);
        }).finally(() => {
            setSyncingEns(false);
        });
      }
      
      publish("energy/event2", "1");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Transaction failed.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div><h2 className="text-lg font-black text-white">Purchase REC Tokens</h2><p className="text-xs text-slate-500 mt-0.5">Listing #{listing.id} · {listing.amount} MWh available</p></div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-xl"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step >= n ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>{n}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Amount to Buy (MWh)</label>
              <input type="number" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm" />
            </div>
            <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <button onClick={() => setActiveDoc('agreement')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${activeDoc === 'agreement' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>Agreement</button>
              <button onClick={() => setActiveDoc('certificate')} className={`flex-1 py-2 rounded-xl text-sm font-bold ${activeDoc === 'certificate' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>Certificate</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-h-64 overflow-y-auto text-[11px] text-slate-300 font-mono">
              {activeDoc === 'agreement' ? agreement.content : certificate.content}
            </div>
            <label className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl cursor-pointer">
              <input type="checkbox" checked={activeDoc === 'agreement' ? agreementChecked : certChecked} onChange={(e) => activeDoc === 'agreement' ? setAgreementChecked(e.target.checked) : setCertChecked(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm text-slate-300">Acknowledge {activeDoc}</span>
            </label>
          </div>}
          {step === 2 && <div className="space-y-4 text-center py-10">
            <Upload size={48} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white">Ready to Upload</h3>
            <p className="text-sm text-slate-400">Documents will be uploaded to Fileverse storage.</p>
          </div>}
          {step === 3 && <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between py-1 border-b border-slate-800 last:border-0"><span className="text-[10px] text-slate-500 uppercase font-bold">Total Cost</span><span className="text-sm text-white font-mono">{cost} Credits</span></div>
            </div>
            <label className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl cursor-pointer">
              <input type="checkbox" checked={finalConfirmed} onChange={(e) => setFinalConfirmed(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm text-slate-300">Confirm hashes and execute transaction</span>
            </label>
          </div>}
        </div>
        <div className="px-6 py-5 border-t border-slate-800 flex justify-between">
          <button onClick={onClose} disabled={executing || syncingEns} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold">Cancel</button>
          {step === 1 && <button disabled={!canProceedFromStep1} onClick={() => setStep(2)} className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-sm">Next</button>}
          {step === 2 && <button onClick={handleUploadToFileverse} disabled={uploading} className="px-6 py-2.5 bg-blue-500 text-white font-black rounded-xl text-sm">{uploading ? 'Uploading...' : 'Upload'}</button>}
          {step === 3 && <button disabled={executing || syncingEns || !finalConfirmed} onClick={handleExecute} className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2">
            {executing ? <Loader2 className="animate-spin" size={16} /> : syncingEns ? <Globe className="animate-pulse" size={16} /> : <Shield size={16} />}
            {executing ? 'Executing...' : syncingEns ? 'Syncing ENS...' : 'Execute Trade'}
          </button>}
        </div>
      </div>
    </div>
  );
};

export default BuyContractModal;
