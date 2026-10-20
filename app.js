const fileInput = document.getElementById('audioFile');
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const processBtn = document.getElementById('processBtn');
const resetBtn = document.getElementById('resetBtn');
const statusBox = document.getElementById('status');
const results = document.getElementById('results');
let selectedFile = null;
let vocalUrl = null;
let musicUrl = null;

fileInput.addEventListener('change', () => selectFile(fileInput.files?.[0] || null));

['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => {
  event.preventDefault();
  dropZone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
}));
dropZone.addEventListener('drop', event => {
  const file = event.dataTransfer?.files?.[0];
  if (file) selectFile(file);
});

function selectFile(file) {
  clearResultUrls();
  selectedFile = file;
  results.classList.add('hidden');
  resetBtn.classList.add('hidden');
  if (!file) {
    fileInfo.classList.add('hidden');
    processBtn.disabled = true;
    statusBox.textContent = 'Pilih file audio untuk memulai.';
    return;
  }
  if (file.type && !file.type.startsWith('audio/')) {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    processBtn.disabled = true;
    statusBox.textContent = 'File ini bukan audio. Silakan pilih file lagu seperti MP3 atau WAV.';
    return;
  }
  fileInfo.textContent = '♫  ' + file.name + ' • ' + formatBytes(file.size);
  fileInfo.classList.remove('hidden');
  processBtn.disabled = false;
  statusBox.textContent = 'File siap diproses.';
}
function formatBytes(bytes) {
  return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
function clearResultUrls() {
  if (vocalUrl) URL.revokeObjectURL(vocalUrl);
  if (musicUrl) URL.revokeObjectURL(musicUrl);
  vocalUrl = null;
  musicUrl = null;
  document.getElementById('vocalPlayer').removeAttribute('src');
  document.getElementById('musicPlayer').removeAttribute('src');
  document.getElementById('vocalDownload').removeAttribute('href');
  document.getElementById('musicDownload').removeAttribute('href');
}
resetBtn.addEventListener('click', () => {
  fileInput.value = '';
  selectFile(null);
  fileInfo.textContent = '';
});

processBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  processBtn.disabled = true;
  results.classList.add('hidden');
  statusBox.textContent = 'Membaca file lagu…';
  let ctx;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Browser ini belum mendukung pemrosesan audio. Coba Chrome versi terbaru.');
    ctx = new AudioCtx();
    const arrayBuffer = await selectedFile.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    if (audioBuffer.numberOfChannels < 2) {
      throw new Error('Lagu ini terbaca sebagai mono (1 saluran). Metode stereo sederhana membutuhkan lagu stereo agar bisa menghasilkan dua hasil yang berarti. Coba file stereo lain.');
    }
    statusBox.textContent = 'Memisahkan audio… mohon tunggu.';
    await new Promise(resolve => setTimeout(resolve, 30));
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const vocal = new Float32Array(audioBuffer.length);
    const music = new Float32Array(audioBuffer.length);
    for (let i = 0; i < audioBuffer.length; i++) {
      vocal[i] = (left[i] + right[i]) * 0.5;
      music[i] = (left[i] - right[i]) * 0.5;
    }
    vocalUrl = URL.createObjectURL(encodeWav(vocal, audioBuffer.sampleRate));
    musicUrl = URL.createObjectURL(encodeWav(music, audioBuffer.sampleRate));
    document.getElementById('vocalPlayer').src = vocalUrl;
    document.getElementById('musicPlayer').src = musicUrl;
    document.getElementById('vocalDownload').href = vocalUrl;
    document.getElementById('musicDownload').href = musicUrl;
    results.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    statusBox.textContent = 'Selesai! Dengarkan kedua hasil sebelum mengunduh.';
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    statusBox.textContent = error?.message || 'Audio tidak dapat diproses. Coba file audio lain.';
  } finally {
    if (ctx && ctx.state !== 'closed') await ctx.close().catch(() => {});
    processBtn.disabled = !selectedFile;
  }
});

function encodeWav(samples, sampleRate) {
  const arrayBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(arrayBuffer);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}