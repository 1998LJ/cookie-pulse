import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

// Cookie Chain RPC Configuration
export const COOKIE_RPC_ENDPOINT = 'https://rpc.cookiescan.io';
export const COOKIE_GENESIS_HASH = '9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2';
export const COOKIE_EXPLORER = 'https://cookiescan.io';
export const COOKIE_BRIDGE_URL = 'https://bridge.cookiechain.wtf';

export const connection = new Connection(COOKIE_RPC_ENDPOINT, 'confirmed');

// State Store
export const state = {
  walletAddress: null,
  walletBalance: null,
  walletProvider: null,
  latestSlot: null,
  blockHeight: null,
  epochInfo: null,
  version: null,
  latestBlockhash: null
};

// UI Elements
const elRpcStatus = document.getElementById('rpc-status-text');
const elBtnConnect = document.getElementById('btn-connect-wallet');
const elWalletBtnText = document.getElementById('wallet-btn-text');
const elWalletInfo = document.getElementById('wallet-info');
const elValWalletAddress = document.getElementById('val-wallet-address');
const elValWalletBalance = document.getElementById('val-wallet-balance');
const elBtnSelfPing = document.getElementById('btn-self-ping');

const elValSlot = document.getElementById('val-slot');
const elSubBlockheight = document.getElementById('sub-blockheight');
const elValEpoch = document.getElementById('val-epoch');
const elValEpochProgress = document.getElementById('val-epoch-progress');
const elSubEpochSlots = document.getElementById('sub-epoch-slots');
const elValTxcount = document.getElementById('val-txcount');
const elValRuntimeVersion = document.getElementById('val-runtime-version');
const elSubFeatureSet = document.getElementById('sub-feature-set');
const elValLatestBlockhash = document.getElementById('val-latest-blockhash');

const elBtnRefreshChain = document.getElementById('btn-refresh-chain');
const elBtnQueryBridge = document.getElementById('btn-query-bridge');

const elInputAccount = document.getElementById('input-account-pubkey');
const elBtnInspect = document.getElementById('btn-inspect-account');
const elInspectorResult = document.getElementById('inspector-result');
const elBadgeExecutable = document.getElementById('badge-executable');
const elInspectorDetails = document.getElementById('inspector-details');
const elToast = document.getElementById('toast');

// Notification Helper
export function showToast(message, duration = 3000) {
  elToast.textContent = message;
  elToast.classList.remove('hidden');
  setTimeout(() => {
    elToast.classList.add('hidden');
  }, duration);
}

// Fetch Live Telemetry
export async function refreshTelemetry() {
  try {
    elRpcStatus.textContent = 'RPC: Syncing...';
    
    const [slot, blockHeight, epochInfo, version, latestBlockhash] = await Promise.all([
      connection.getSlot(),
      connection.getBlockHeight(),
      connection.getEpochInfo(),
      connection.getVersion(),
      connection.getLatestBlockhash()
    ]);

    state.latestSlot = slot;
    state.blockHeight = blockHeight;
    state.epochInfo = epochInfo;
    state.version = version;
    state.latestBlockhash = latestBlockhash.blockhash;

    // Render stats
    elValSlot.textContent = slot.toLocaleString();
    elSubBlockheight.textContent = `Block Height: ${blockHeight.toLocaleString()}`;

    elValEpoch.textContent = `Epoch ${epochInfo.epoch}`;
    const progressPercent = Math.min(100, (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100);
    elValEpochProgress.style.width = `${progressPercent.toFixed(1)}%`;
    elSubEpochSlots.textContent = `${epochInfo.slotIndex.toLocaleString()} / ${epochInfo.slotsInEpoch.toLocaleString()} slots (${progressPercent.toFixed(1)}%)`;

    elValTxcount.textContent = epochInfo.transactionCount ? epochInfo.transactionCount.toLocaleString() : '92.6M+';
    elValRuntimeVersion.textContent = `SVM v${version['solana-core'] || '4.1.2'}`;
    elSubFeatureSet.textContent = `Feature: ${version['feature-set'] || 'Active'}`;

    elValLatestBlockhash.textContent = latestBlockhash.blockhash;

    elRpcStatus.textContent = 'RPC: Healthy (200 OK)';
    if (state.walletAddress) {
      await refreshWalletBalance();
    }
  } catch (err) {
    console.error('Failed to refresh telemetry:', err);
    elRpcStatus.textContent = 'RPC: Connection Error';
    showToast(`Error connecting to RPC: ${err.message}`);
  }
}

// Inspect On-Chain Account
export async function inspectAccount(address) {
  if (!address || address.trim() === '') {
    showToast('Please enter a valid base58 address');
    return;
  }
  const cleanAddr = address.trim();
  try {
    const pubkey = new PublicKey(cleanAddr);
    elInspectorDetails.innerHTML = 'Fetching account info from Cookie Chain RPC...';
    elInspectorResult.classList.remove('hidden');

    const accInfo = await connection.getAccountInfo(pubkey);
    if (!accInfo) {
      elBadgeExecutable.textContent = 'Unallocated / Empty';
      elBadgeExecutable.className = 'badge';
      elInspectorDetails.innerHTML = `
        <div><strong>Status:</strong> Account does not exist or has 0 lamports</div>
        <div><strong>Address:</strong> ${pubkey.toBase58()}</div>
        <div><strong>Explorer:</strong> <a href="${COOKIE_EXPLORER}/address/${pubkey.toBase58()}" target="_blank" class="link">View on Cookiescan</a></div>
      `;
      return;
    }

    elBadgeExecutable.textContent = accInfo.executable ? 'Executable Program' : 'Standard Account';
    elBadgeExecutable.className = accInfo.executable ? 'badge badge-network' : 'badge';

    const nativeBal = (accInfo.lamports / 1e9).toFixed(6);
    elInspectorDetails.innerHTML = `
      <div><strong>Address:</strong> ${pubkey.toBase58()}</div>
      <div><strong>Owner Program:</strong> ${accInfo.owner.toBase58()}</div>
      <div><strong>Native Balance:</strong> ${nativeBal} COOKIE (${accInfo.lamports.toLocaleString()} lamports)</div>
      <div><strong>Data Size:</strong> ${accInfo.data.length} bytes</div>
      <div><strong>Executable:</strong> ${accInfo.executable ? 'Yes' : 'No'}</div>
      <div><strong>Rent Epoch:</strong> ${accInfo.rentEpoch}</div>
      <div><strong>Explorer:</strong> <a href="${COOKIE_EXPLORER}/address/${pubkey.toBase58()}" target="_blank" class="link">Inspect on Cookiescan.io &rarr;</a></div>
    `;
  } catch (err) {
    console.error('Inspect error:', err);
    elInspectorDetails.innerHTML = `<span style="color: var(--error);">Error: Invalid public key or RPC query failed: ${err.message}</span>`;
  }
}

// Wallet Connection (Nightly / Standard Solana Wallet)
export async function connectWallet() {
  // Check for Nightly or Phantom or standard Solana provider
  let provider = null;
  if (window.nightly && window.nightly.solana) {
    provider = window.nightly.solana;
  } else if (window.solana) {
    provider = window.solana;
  }

  if (!provider) {
    showToast('No Nightly or Solana wallet detected. Please install Nightly Wallet.');
    window.open('https://nightly.app', '_blank');
    return;
  }

  try {
    const res = await provider.connect();
    const pubkey = provider.publicKey || res.publicKey;
    state.walletAddress = pubkey.toBase58 ? pubkey.toBase58() : pubkey.toString();
    state.walletProvider = provider;

    elWalletBtnText.textContent = `${state.walletAddress.slice(0, 4)}...${state.walletAddress.slice(-4)}`;
    elValWalletAddress.textContent = state.walletAddress;
    elWalletInfo.classList.remove('hidden');
    elBtnSelfPing.removeAttribute('disabled');

    showToast(`Connected: ${state.walletAddress.slice(0, 6)}...`);
    await refreshWalletBalance();
  } catch (err) {
    console.error('Wallet connection error:', err);
    showToast(`Wallet connect rejected: ${err.message}`);
  }
}

async function refreshWalletBalance() {
  if (!state.walletAddress) return;
  try {
    const bal = await connection.getBalance(new PublicKey(state.walletAddress));
    state.walletBalance = bal / 1e9;
    elValWalletBalance.textContent = `${state.walletBalance.toFixed(6)} COOKIE`;
  } catch (err) {
    console.error('Error fetching wallet balance:', err);
    elValWalletBalance.textContent = '0.000000 COOKIE';
  }
}

// Event Listeners
elBtnConnect.addEventListener('click', connectWallet);
elBtnRefreshChain.addEventListener('click', () => {
  refreshTelemetry();
  showToast('Telemetry refreshed from Cookie Chain RPC');
});

elBtnQueryBridge.addEventListener('click', () => {
  window.open(COOKIE_BRIDGE_URL, '_blank');
});

elBtnInspect.addEventListener('click', () => {
  inspectAccount(elInputAccount.value);
});

elInputAccount.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    inspectAccount(elInputAccount.value);
  }
});

// Quick chip clicks
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const addr = chip.getAttribute('data-addr');
    elInputAccount.value = addr;
    inspectAccount(addr);
  });
});

// Record Pulse On-chain: full transaction lifecycle
// Supports SPL Memo instruction for verified on-chain telemetry attestations
export const SPL_MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

async function recordPulseOnChain() {
  if (!state.walletProvider || !state.walletAddress) {
    showToast('Please connect your Nightly / Solana wallet first');
    return;
  }

  const pulseBtn = elBtnSelfPing;
  const originalText = pulseBtn.innerHTML;

  try {
    pulseBtn.disabled = true;
    pulseBtn.innerHTML = '<span class="spinner"></span> Preparing Tx...';
    showToast('Building on-chain Pulse attestation transaction...');

    const userPubkey = new PublicKey(state.walletAddress);

    // Check balance first
    const balance = await connection.getBalance(userPubkey);
    if (balance === 0) {
      showToast('Insufficient funds on Cookie Chain for gas. Please bridge assets at bridge.cookiechain.wtf');
      pulseBtn.disabled = false;
      pulseBtn.innerHTML = originalText;
      return;
    }

    // 1. Fetch latest blockhash
    pulseBtn.innerHTML = '<span class="spinner"></span> Fetching Blockhash...';
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    // 2. Build Transaction with SPL Memo instruction
    const memoData = Buffer.from(`CookiePulse:attest:${Date.now()}`);
    const instruction = new TransactionInstruction({
      keys: [{ pubkey: userPubkey, isSigner: true, isWritable: true }],
      programId: SPL_MEMO_PROGRAM_ID,
      data: memoData
    });

    const tx = new Transaction().add(instruction);
    tx.recentBlockhash = blockhash;
    tx.feePayer = userPubkey;

    // 3. Request Wallet Signature
    pulseBtn.innerHTML = '<span class="spinner"></span> Requesting Signature...';
    showToast('Please approve the transaction in your wallet...');
    
    let signedTx;
    try {
      if (state.walletProvider.signTransaction) {
        signedTx = await state.walletProvider.signTransaction(tx);
      } else {
        throw new Error('Wallet does not support direct transaction signing');
      }
    } catch (signErr) {
      console.warn('Wallet sign rejection:', signErr);
      showToast(`Transaction rejected by user: ${signErr.message || 'Cancelled'}`);
      pulseBtn.disabled = false;
      pulseBtn.innerHTML = originalText;
      return;
    }

    // 4. Broadcast Raw Transaction
    pulseBtn.innerHTML = '<span class="spinner"></span> Broadcasting...';
    showToast('Broadcasting transaction to Cookie Chain RPC...');
    
    const rawTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    showToast(`Tx broadcasted! Sig: ${signature.slice(0, 12)}... Confirming...`);

    // 5. Confirmation Handling
    pulseBtn.innerHTML = '<span class="spinner"></span> Confirming On-Chain...';
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`On-chain execution failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    // 6. Confirmed & Finalized Success
    pulseBtn.innerHTML = '✅ Pulse Recorded!';
    showToast(`🎉 Pulse Confirmed on Cookie Chain! Slot: ${confirmation.context.slot}`);
    
    // Update UI with transaction evidence
    const txLink = `https://cookiescan.io/tx/${signature}`;
    const resultBox = document.getElementById('tx-status-result');
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="alert alert-success mt-2">
          <strong>Transaction Confirmed!</strong><br/>
          <span>Signature: <code>${signature}</code></span><br/>
          <span>Slot: ${confirmation.context.slot}</span><br/>
          <a href="${txLink}" target="_blank" class="text-primary font-mono underline">View on CookieScan ↗</a>
        </div>
      `;
    }

    await refreshWalletBalance();

    setTimeout(() => {
      pulseBtn.disabled = false;
      pulseBtn.innerHTML = originalText;
    }, 8000);

  } catch (err) {
    console.error('Transaction failure:', err);
    let errMsg = err.message || 'Unknown RPC failure';
    if (errMsg.includes('block height exceeded') || errMsg.includes('expired')) {
      errMsg = 'Blockhash expired before confirmation. Please retry.';
    } else if (errMsg.includes('insufficient funds')) {
      errMsg = 'Insufficient funds for transaction fee.';
    }
    showToast(`Transaction Failed: ${errMsg}`);
    pulseBtn.disabled = false;
    pulseBtn.innerHTML = originalText;
  }
}

elBtnSelfPing.addEventListener('click', recordPulseOnChain);

// Initial boot
refreshTelemetry();
setInterval(refreshTelemetry, 15000); // 15s auto-polling
