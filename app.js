import { stickers } from './data.js?v=3';
import { GIFEncoder, quantize, applyPalette } from './vendor/gifenc.esm.js';

const $ = selector => document.querySelector(selector);
let filter = 'counts', background = 'transparent', selected = stickers[0];
const size = bytes => `${(bytes / 1024).toFixed(1)} KB`;
function enableFileDrag(image, filename) {
  image.draggable = true;
  image.addEventListener('dragstart', event => {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('DownloadURL', `image/gif:${filename()}:${image.src}`);
  });
}
function matches(item) {
  const group = filter === 'all' || (filter === 'counts' && item.featured) || (filter === 'frog' && item.frog) || (filter === 'animation' && item.type === 'animation');
  return group && item.title.toLocaleLowerCase().includes($('#search').value.trim().toLocaleLowerCase());
}
function render() {
  const results = stickers.filter(matches);
  $('#grid').replaceChildren(...results.map(item => {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'card' + (selected.id === item.id ? ' selected' : '');
    card.setAttribute('aria-label', `预览 ${item.title}`); card.setAttribute('aria-pressed', String(selected.id === item.id));
    const img = document.createElement('img'); img.src = item[background].url; img.alt = ''; img.loading = 'lazy'; img.width = 240; img.height = 240;
    enableFileDrag(img, () => `捂脸哭_${item.id}_${background}.gif`);
    const title = document.createElement('span'); title.className = 'card-title'; title.textContent = item.title;
    const info = document.createElement('small'); info.textContent = `GIF · ${size(item[background].bytes)}`;
    card.append(img, title, info);
    card.addEventListener('click', () => { selected = item; updatePreview(); render(); if (matchMedia('(max-width:720px)').matches) $('#preview').scrollIntoView({block:'center'}); });
    return card;
  }));
  $('#result-count').textContent = `${results.length} 张表情`; $('#empty').hidden = Boolean(results.length);
}
function updatePreview() {
  const file = selected[background];
  $('#preview-image').src = file.url; $('#preview-image').alt = selected.title;
  $('#preview-title').textContent = selected.title;
  $('#download-one').href = file.url; $('#download-one').download = `捂脸哭_${selected.id}_${background}.gif`;
  $('#file-info').textContent = `240 × 240 px · ${size(file.bytes)} · 循环 GIF`;
  $('#preview-stage').classList.toggle('transparent', background === 'transparent');
  $('#canvas').classList.toggle('transparent', background === 'transparent');
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); });
  const results = stickers.filter(matches); if (results.length) selected = results[0];
  render(); updatePreview();
}));
document.querySelectorAll('[data-bg]').forEach(button => button.addEventListener('click', () => {
  background = button.dataset.bg;
  document.querySelectorAll('[data-bg]').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); });
  render(); updatePreview();
  if(master.complete && master.naturalWidth) draw();
}));
$('#search').addEventListener('input', render);
enableFileDrag($('#preview-image'), () => `捂脸哭_${selected.id}_${background}.gif`);
render(); updatePreview();

const master = new Image(); master.src = 'assets/master.png';
const canvas = $('#canvas'), ctx = canvas.getContext('2d', {willReadFrequently: true});
const masterReady = master.decode();
function draw(offset = 0) {
  const raw = $('#multiplier').value.trim().replace(/^\s*[×xX]\s*/, '');
  const caption = `×${raw || '2'}`;
  ctx.clearRect(0, 0, 240, 240);
  if(background === 'white') {ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 240, 240);}
  ctx.drawImage(master, 43 + offset, 9, 154, 154);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#17191d';
  let fontSize = 33;
  const setFont = () => {ctx.font = `700 ${fontSize}px "Segoe UI", "Microsoft YaHei", "Segoe UI Symbol", sans-serif`;};
  setFont(); while (ctx.measureText(caption).width > 218 && fontSize > 8) { fontSize -= .5; setFont(); }
  if (ctx.measureText(caption).width > 218) {
    const chars = [...caption], rows = [], maxWidth = 218;
    let row = ''; for (const char of chars) { if (ctx.measureText(row + char).width > maxWidth && row) { rows.push(row); row = ''; } row += char; } if(row) rows.push(row);
    rows.slice(0, 3).forEach((line, i) => ctx.fillText(line, 120, 189 + i * 12));
  } else ctx.fillText(caption, 120, 193);
}
masterReady.then(() => draw()).catch(() => { $('#maker-status').textContent = '底图加载失败，请刷新后重试。'; $('#make-gif').disabled = true; });
$('#multiplier').addEventListener('input', () => { if(master.complete && master.naturalWidth) draw(); });
document.querySelectorAll('[data-value]').forEach(button => button.addEventListener('click', () => { $('#multiplier').value = button.dataset.value; draw(); }));
$('#make-gif').addEventListener('click', async () => {
  const button = $('#make-gif'); button.disabled = true; $('#maker-status').textContent = '正在生成 GIF…';
  try {
    await masterReady; await document.fonts.ready;
    const encoder = GIFEncoder();
    for (const offset of [0, 1]) {
      draw(offset); const rgba = ctx.getImageData(0, 0, 240, 240).data;
      const transparent = background === 'transparent';
      const palette = quantize(rgba, transparent ? 255 : 256, {format:'rgb565'});
      const indexed = applyPalette(rgba, palette, 'rgb565');
      if(transparent) {
        while(palette.length < 256) palette.push([0,0,0]);
        for(let i=0;i<indexed.length;i++) if(rgba[i*4+3]<128) indexed[i]=255;
      }
      encoder.writeFrame(indexed, 240, 240, {palette, delay:1000, repeat:0, dispose:2, transparent, transparentIndex:255});
    }
    encoder.finish(); const blob = new Blob([encoder.bytes()], {type:'image/gif'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    const backgroundName = background === 'transparent' ? '透明' : '白底';
    link.href = url; link.download = `捂脸哭_自定义倍数_${backgroundName}.gif`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    $('#maker-status').textContent = `已生成 ${size(blob.size)} 的两帧${backgroundName} GIF。拖入微信发送后，右键检查「添加到表情」。`;
  } catch (error) { $('#maker-status').textContent = '生成失败，请刷新后重试。'; console.error(error); }
  finally { draw(); button.disabled = false; }
});
