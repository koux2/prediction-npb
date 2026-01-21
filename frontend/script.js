

const CENTRAL_TEAMS = [
    { id: 'giants', name: '巨人', className: 'team-giants' },
    { id: 'tigers', name: '阪神', className: 'team-tigers' },
    { id: 'baystars', name: 'DeNA', className: 'team-baystars' },
    { id: 'carp', name: '広島', className: 'team-carp' },
    { id: 'dragons', name: '中日', className: 'team-dragons' },
    { id: 'swallows', name: 'ヤクルト', className: 'team-swallows' }
];

const PACIFIC_TEAMS = [
    { id: 'hawks', name: 'ソフトバンク', short: 'ソ', className: 'team-hawks' },
    { id: 'lions', name: '西武', short: '西', className: 'team-lions' },
    { id: 'eagles', name: '楽天', short: '楽', className: 'team-eagles' },
    { id: 'buffaloes', name: 'オリックス', short: 'オ', className: 'team-buffaloes' },
    { id: 'fighters', name: '日本ハム', short: '日', className: 'team-fighters' },
    { id: 'marines', name: 'ロッテ', short: 'ロ', className: 'team-marines' }
];

// デフォルトのチーム順（名前で指定）
const DEFAULT_CENTRAL_ORDER = ['阪神', 'DeNA', '巨人', '中日', '広島', 'ヤクルト'];
const DEFAULT_PACIFIC_ORDER = ['ソフトバンク', '日本ハム', 'オリックス', '楽天', '西武', 'ロッテ'];

let currentData = [];

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initRouting();
    generateInputs();

    // API URLが設定されていない場合のアラート
    if (API_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        alert('スクリプトファイル(script.js)内の API_URL をGASのウェブアプリURL設定してください。');
    }

    document.getElementById('prediction-form').addEventListener('submit', handleSubmit);
    document.getElementById('download-csv-btn').addEventListener('click', downloadCSV);
});

function initRouting() {
    const tabInput = document.getElementById('tab-input');
    const tabResult = document.getElementById('tab-result');
    const inputView = document.getElementById('input-view');
    const resultView = document.getElementById('result-view');

    // タブ切り替え処理（UI更新のみ）
    const showTab = (tabId) => {
        if (tabId === 'input') {
            tabInput.classList.add('active');
            tabResult.classList.remove('active');
            inputView.classList.add('active');
            resultView.classList.remove('active');
        } else if (tabId === 'result') {
            tabResult.classList.add('active');
            tabInput.classList.remove('active');
            resultView.classList.add('active');
            inputView.classList.remove('active');
            fetchAndRenderResults();
        }
    };

    // 現在のハッシュに基づいてタブを表示
    const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '') || 'input';
        showTab(hash);
    };

    // クリック時はハッシュを更新（履歴に追加）
    tabInput.addEventListener('click', () => {
        window.location.hash = 'input';
    });

    tabResult.addEventListener('click', () => {
        window.location.hash = 'result';
    });

    // 戻る/進むボタン対応
    window.addEventListener('hashchange', handleHashChange);

    // 初回ロード時の実行
    handleHashChange();
}

function generateInputs() {
    const createList = (teams, defaultOrder, containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear existing

        // デフォルト順に並び替え
        const orderedTeams = defaultOrder.map(name => teams.find(t => t.name === name)).filter(Boolean);

        // 万が一漏れがあれば末尾に追加
        teams.forEach(t => {
            if (!orderedTeams.includes(t)) orderedTeams.push(t);
        });

        orderedTeams.forEach(team => {
            const card = document.createElement('div');
            card.className = `team-card ${team.className}`;
            card.textContent = team.name;
            card.draggable = true;
            card.dataset.value = team.name;

            // Drag Events
            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            container.appendChild(card);
        });

        // Container Events
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                container.appendChild(draggable);
            } else {
                container.insertBefore(draggable, afterElement);
            }
        });
    };

    createList(CENTRAL_TEAMS, DEFAULT_CENTRAL_ORDER, 'central-inputs');
    createList(PACIFIC_TEAMS, DEFAULT_PACIFIC_ORDER, 'pacific-inputs');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.team-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function handleSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';

    const data = {
        name: document.getElementById('user-name').value,
        central: [],
        pacific: []
    };

    // DOMの順序からデータを取得
    const centralCards = document.querySelectorAll('#central-inputs .team-card');
    const pacificCards = document.querySelectorAll('#pacific-inputs .team-card');

    centralCards.forEach(card => data.central.push(card.dataset.value));
    pacificCards.forEach(card => data.pacific.push(card.dataset.value));

    // 簡易重複チェック
    if (new Set(data.central).size !== 6 || new Set(data.pacific).size !== 6) {
        alert('順位予想に重複があります。各チームを1回ずつ選択してください。');
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
        return;
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            // GASの仕様上、CORSエラーを回避するためにno-cors等は使わず、redirect: followが必要な場合があるが
            // 今回は application/json を送るために単純なfetchを行う。
            // GAS側で Content-Type: application/json を返すようにしているため、corsモードで動作するはずだが、
            // POSTの場合、preflightで失敗することがある。
            // 実際には text/plain で送って GAS側で JSON.parse(e.postData.contents) するのが最も安定する。
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });

        alert('送信しました！');
        document.getElementById('prediction-form').reset();
        // Reset order
        generateInputs();
        // Reset order
        generateInputs();
        window.location.hash = 'result'; // 結果タブへ移動

    } catch (error) {
        console.error(error);
        alert('送信に失敗しました。');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
    }
}

async function fetchAndRenderResults() {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('result-grid');

    loading.classList.remove('hidden');
    grid.innerHTML = '';

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        currentData = data; // CSV出力用に保持

        renderGrid(data);
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p>データの取得に失敗しました。</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

function renderGrid(data) {
    const grid = document.getElementById('result-grid');
    if (data.length === 0) {
        grid.innerHTML = '<p>データがありません。</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Headers
    const trHead = document.createElement('tr');
    trHead.innerHTML = `
        <th class="header-corner" rowspan="2">名前</th>
        <th class="header-central" colspan="6">セ・リーグ</th>
        <th class="header-pacific" colspan="6">パ・リーグ</th>
    `;
    const trSubHead = document.createElement('tr');
    let subHeadHTML = '';
    for (let i = 1; i <= 6; i++) subHeadHTML += `<th class="header-central">${i}</th>`;
    for (let i = 1; i <= 6; i++) subHeadHTML += `<th class="header-pacific">${i}</th>`;
    trSubHead.innerHTML = subHeadHTML;

    thead.appendChild(trHead);
    thead.appendChild(trSubHead);
    table.appendChild(thead);

    // Rows
    data.forEach(row => {
        const tr = document.createElement('tr');

        // Name
        const tdName = document.createElement('td');
        tdName.className = 'name-cell';
        tdName.textContent = row.Name;
        tr.appendChild(tdName);

        // Central
        for (let i = 1; i <= 6; i++) {
            const teamName = row[`Central${i}`];
            const td = document.createElement('td');
            td.textContent = getShortName(teamName);
            td.className = `team-cell ${getTeamClass(teamName)}`;
            tr.appendChild(td);
        }

        // Pacific
        for (let i = 1; i <= 6; i++) {
            const teamName = row[`Pacific${i}`];
            const td = document.createElement('td');
            td.textContent = getShortName(teamName);
            td.className = `team-cell ${getTeamClass(teamName)}`;
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    grid.appendChild(table);
}

function getTeamClass(name) {
    const allTeams = [...CENTRAL_TEAMS, ...PACIFIC_TEAMS];
    const team = allTeams.find(t => t.name === name);
    return team ? team.className : '';
}

function getShortName(name) {
    // 画面表示は短縮名（例：巨人、神、D、広...）にしたい場合
    // ユーザー画像に合わせて1文字〜2文字の略称に変換する
    const map = {
        '巨人': '巨',
        '阪神': '神',
        'DeNA': 'D',
        '広島': '広',
        '中日': '中',
        'ヤクルト': 'ヤ',
        'ソフトバンク': 'ソ',
        '西武': '西',
        '楽天': '楽',
        'オリックス': 'オ',
        '日本ハム': '日',
        'ロッテ': 'ロ'
    };
    return map[name] || name;
}

function downloadCSV() {
    if (!currentData || currentData.length === 0) {
        alert('データがありません。先に集計結果を表示してください。');
        return;
    }

    // CSV生成 (名前, セ1~6, パ1~6)
    // チーム名は頭文字だけにする
    const lines = currentData.map(row => {
        const cols = [row.Name];
        // Central
        for (let i = 1; i <= 6; i++) {
            const teamName = row[`Central${i}`];
            cols.push(teamName.charAt(0));
        }
        // Pacific
        for (let i = 1; i <= 6; i++) {
            const teamName = row[`Pacific${i}`];
            cols.push(teamName.charAt(0));
        }
        return cols.join(',');
    });

    const csvContent = lines.join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // BOM付与 (Excel文字化け対策)
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
