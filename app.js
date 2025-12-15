// 簡易設定
const WEEKDAYS = ['月','火','水','木','金','土']; // 6列
const PERIODS = 7; // 1〜7時限
const STORAGE_KEY = 'timetable-data-v1';

const timetableEl = document.getElementById('timetable');
const toggleBtn = document.getElementById('toggle-edit');
const modal = document.getElementById('modal');
const backdrop = document.getElementById('modal-backdrop');
const form = document.getElementById('edit-form');
const subjectInput = document.getElementById('subject');
const roomInput = document.getElementById('room');
const timeInput = document.getElementById('time');
const deleteBtn = document.getElementById('delete-btn');
const cancelBtn = document.getElementById('cancel-btn');

let editing = false;
let data = {}; // { "月-1": {subject, room, time}, ... }
let activeKey = null;

// 初期化
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : {};
  }catch(e){
    data = {};
  }
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// グリッド生成
function buildGrid(){
  // clear
  timetableEl.innerHTML = '';

  // grid: first row: corner + weekdays
  const corner = document.createElement('div');
  corner.className = 'header-cell corner';
  corner.textContent = '時限／曜日';
  timetableEl.appendChild(corner);

  WEEKDAYS.forEach(d=>{
    const h = document.createElement('div');
    h.className = 'header-cell';
    h.textContent = d;
    timetableEl.appendChild(h);
  });

  // rows: for each period, left label + cells
  for(let p=1;p<=PERIODS;p++){
    const label = document.createElement('div');
    label.className = 'period-cell';
    label.textContent = `${p}限`;
    timetableEl.appendChild(label);

    WEEKDAYS.forEach(d=>{
      const key = `${d}-${p}`;
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.key = key;

      const item = data[key];
      if(item && (item.subject || item.room || item.time)){
        const subj = document.createElement('div');
        subj.className = 'subject';
        subj.textContent = item.subject || '';
        slot.appendChild(subj);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${item.room || ''}${item.room && item.time ? ' · ' : ''}${item.time || ''}`;
        slot.appendChild(meta);
      }else{
        // 空セルは薄いプレースホルダにしても良い
        slot.innerHTML = '<div style="color:#bbb">（空）</div>';
      }

      // クリックで編集（編集モードのときのみ）
      slot.addEventListener('click', (e)=>{
        if(!editing) return;
        openEditor(key);
      });

      timetableEl.appendChild(slot);
    });
  }

  // クラス更新
  updateEditingState();
}

// 編集モード切替
function setEditing(flag){
  editing = flag;
  updateEditingState();
  toggleBtn.textContent = `編集モード: ${editing ? 'ON' : 'OFF'}`;
}
function updateEditingState(){
  if(editing){
    timetableEl.classList.add('editing');
    // all slots mark editable
    timetableEl.querySelectorAll('.slot').forEach(s=>s.classList.add('editable'));
  }else{
    timetableEl.classList.remove('editing');
    timetableEl.querySelectorAll('.slot').forEach(s=>s.classList.remove('editable'));
  }
}

// モーダル操作
function openEditor(key){
  activeKey = key;
  const item = data[key] || {};
  subjectInput.value = item.subject || '';
  roomInput.value = item.room || '';
  timeInput.value = item.time || '';
  modal.setAttribute('aria-hidden','false');
  modal.style.display = 'flex';
  subjectInput.focus();
}
function closeEditor(){
  activeKey = null;
  modal.setAttribute('aria-hidden','true');
  modal.style.display = 'none';
  form.reset();
}

// 保存
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(!activeKey) return;
  const subject = subjectInput.value.trim();
  const room = roomInput.value.trim();
  const time = timeInput.value.trim();
  if(!subject && !room && !time){
    // 空なら削除
    delete data[activeKey];
  }else{
    data[activeKey] = {subject, room, time};
  }
  saveData();
  buildGrid();
  closeEditor();
});

// 削除
deleteBtn.addEventListener('click', ()=>{
  if(!activeKey) return;
  delete data[activeKey];
  saveData();
  buildGrid();
  closeEditor();
});

// キャンセル
cancelBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  closeEditor();
});
backdrop.addEventListener('click', closeEditor);

// トグルボタン
toggleBtn.addEventListener('click', ()=>{
  setEditing(!editing);
});

// 初期ロード
loadData();
buildGrid();
setEditing(false);

// キーボード：Escでモーダル閉じる
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    if(modal.getAttribute('aria-hidden') === 'false'){
      closeEditor();
    }else if(editing){
      setEditing(false);
    }
  }
});
