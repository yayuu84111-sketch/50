let currentMembers = [];

async function fetchMembers() {
    const guildId = document.getElementById('guildId').value.trim();
    const token = document.getElementById('userToken').value.trim();
    
    hideAllSections();
    
    if (!guildId || !token) {
        showError('サーバーIDとトークンの両方を入力してください');
        return;
    }
    
    if (!/^\d{17,19}$/.test(guildId)) {
        showError('有効なサーバーIDを入力してください（17-19桁の数字）');
        return;
    }
    
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('fetchBtn').disabled = true;
    document.getElementById('fetchBtn').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Gateway経由で取得中...';
    
    try {
        const response = await fetch('/api/members-gateway', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                guildId: guildId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Unknown error');
        }
        
        currentMembers = data.members;
        displayResults(data.members, data.count, data.totalMemberCount, data.onlineCount);
        
    } catch (error) {
        console.error('Error:', error);
        showError(getErrorMessage(error.message));
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('fetchBtn').disabled = false;
        document.getElementById('fetchBtn').innerHTML = '<i class="fas fa-users mr-2"></i>メンバーを取得';
    }
}

function displayResults(members, count, totalMemberCount, onlineCount) {
    let countText = count.toString();
    if (totalMemberCount && totalMemberCount > count) {
        countText += ` / ${totalMemberCount}`;
    }
    if (onlineCount) {
        countText += ` (オンライン: ${onlineCount})`;
    }
    document.getElementById('memberCount').textContent = countText;
    
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    
    members.forEach((member, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors';
        
        const displayName = member.nickname || member.username;
        const discriminator = member.discriminator !== '0' ? `#${member.discriminator}` : '';
        
        memberDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-gray-400 text-sm w-8">${index + 1}</span>
                <div>
                    <div class="text-white font-medium">${escapeHtml(displayName)}${discriminator}</div>
                    <div class="text-gray-400 text-sm font-mono">${member.id}</div>
                </div>
            </div>
            <button onclick="copyToClipboard('${member.id}')" class="text-blue-400 hover:text-blue-300 transition-colors">
                <i class="fas fa-copy"></i>
            </button>
        `;
        
        memberList.appendChild(memberDiv);
    });
    
    document.getElementById('results').classList.remove('hidden');
}

function copyAllIds() {
    const ids = currentMembers.map(member => member.id).join('\n');
    copyToClipboard(ids, 'すべてのIDをコピーしました！');
}

function copyToClipboard(text, message = 'IDをコピーしました！') {
    navigator.clipboard.writeText(text).then(() => {
        showToast(message);
    }).catch(err => {
        console.error('コピーに失敗しました:', err);
        showToast('コピーに失敗しました', 'error');
    });
}

function downloadCSV() {
    const csvContent = 'ID,Username,Discriminator,Nickname\n' + 
        currentMembers.map(member => 
            `${member.id},"${escapeCSV(member.username)}","${member.discriminator}","${escapeCSV(member.nickname || '')}"`
        ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `discord_members_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSVファイルをダウンロードしました！');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').classList.remove('hidden');
}

function hideAllSections() {
    document.getElementById('results').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('loading').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transform transition-all duration-300 ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function getErrorMessage(error) {
    const errorMessages = {
        'Invalid token': 'トークンが無効です',
        'Insufficient permissions': '権限が不足しています',
        'Guild not found': 'サーバーが見つかりません',
        'Internal server error': 'サーバーエラーが発生しました'
    };
    
    return errorMessages[error] || `エラー: ${error}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeCSV(text) {
    if (!text) return '';
    return text.replace(/"/g, '""');
}

function switchTab(tabName) {
    document.getElementById('membersTab').classList.add('hidden');
    document.getElementById('aankoTab').classList.add('hidden');
    
    document.getElementById('membersTabBtn').classList.remove('bg-blue-600');
    document.getElementById('membersTabBtn').classList.add('bg-white/10');
    document.getElementById('aankoTabBtn').classList.remove('bg-blue-600');
    document.getElementById('aankoTabBtn').classList.add('bg-white/10');
    
    if (tabName === 'members') {
        document.getElementById('membersTab').classList.remove('hidden');
        document.getElementById('membersTabBtn').classList.add('bg-blue-600');
        document.getElementById('membersTabBtn').classList.remove('bg-white/10');
    } else if (tabName === 'aanko') {
        document.getElementById('aankoTab').classList.remove('hidden');
        document.getElementById('aankoTabBtn').classList.add('bg-blue-600');
        document.getElementById('aankoTabBtn').classList.remove('bg-white/10');
        loadBotInfo();
    }
}

async function loadBotInfo() {
    const serverInviteUrl = 'https://discord.gg/NYmSAdHjWV';
    document.getElementById('botInviteUrl').value = serverInviteUrl;
    document.getElementById('botInviteLink').href = serverInviteUrl;
    
    try {
        const response = await fetch('/api/bot/info');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('storedMemberCount').innerHTML = 
                `<i class="fas fa-database mr-2"></i>${data.storedMemberCount} 人のIDが保存済み`;
            document.getElementById('botStatusIndicator').classList.add('bg-green-500');
            document.getElementById('botStatusIndicator').classList.remove('bg-red-500');
            document.getElementById('botStatusText').textContent = 'Bot稼働中';
        }
    } catch (error) {
        console.error('Error loading bot info:', error);
        document.getElementById('botStatusIndicator').classList.remove('bg-green-500');
        document.getElementById('botStatusIndicator').classList.add('bg-red-500');
        document.getElementById('botStatusText').textContent = 'Bot接続エラー';
    }
    
    try {
        const configResponse = await fetch('/api/config/default-message');
        const configData = await configResponse.json();
        
        if (configData.success && configData.defaultMessage) {
            window.storedDefaultMessage = configData.defaultMessage;
        }
    } catch (error) {
        console.error('Error loading default message:', error);
    }
}

function copyInviteUrl() {
    const url = document.getElementById('botInviteUrl').value;
    if (url) {
        copyToClipboard(url, '招待URLをコピーしました！');
    }
}

function insertMemberIdsToInput() {
    if (currentMembers.length === 0) {
        showToast('先にメンバーを取得してください', 'error');
        return;
    }
    
    const memberIds = currentMembers.map(m => m.id);
    const idsText = memberIds.join(', ');
    
    document.getElementById('aankoUserIds').value = idsText;
    
    const aheUserIds = document.getElementById('aheButtonUserIds');
    if (aheUserIds) aheUserIds.value = idsText;
    
    document.getElementById('storedMemberCount').innerHTML = 
        `<i class="fas fa-check-circle mr-2"></i>${memberIds.length} 人挿入済み`;
    
    showToast(`${memberIds.length} 人のメンバーIDを全ての入力欄に挿入しました！`);
}

async function fetchMembersFromAankoTab() {
    const guildId = document.getElementById('guildId').value.trim();
    const token = document.getElementById('userToken').value.trim();
    
    if (!guildId || !token) {
        showToast('サーバーIDとトークンを入力してください', 'error');
        return;
    }
    
    if (!/^\d{17,19}$/.test(guildId)) {
        showToast('有効なサーバーIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('aankoFetchBtn');
    const countSpan = document.getElementById('storedMemberCount');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>取得中...';
    
    try {
        const response = await fetch('/api/members-gateway', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                guildId: guildId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Unknown error');
        }
        
        currentMembers = data.members;
        countSpan.innerHTML = `<i class="fas fa-check-circle mr-2 text-green-400"></i>${data.count} 人取得済み`;
        showToast(`${data.count} 人のメンバーを取得しました！`);
        
    } catch (error) {
        console.error('Error:', error);
        countSpan.innerHTML = `<i class="fas fa-times-circle mr-2 text-red-400"></i>取得失敗`;
        showToast(getErrorMessage(error.message), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-users mr-2"></i>メンバーを取得';
    }
}

async function debugSearchAanko() {
    const token = document.getElementById('userToken').value.trim();
    const channelId = document.getElementById('testChannelId').value.trim();
    
    if (!token) {
        showToast('トークンを入力してください', 'error');
        return;
    }
    
    if (!channelId) {
        showToast('チャンネルIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('debugSearchBtn');
    const resultDiv = document.getElementById('testResult');
    const resultText = document.getElementById('testResultText');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>検索中...';
    resultDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/api/debug-search-aanko', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, channelId })
        });
        
        const data = await response.json();
        
        resultDiv.classList.remove('hidden');
        
        if (data.success) {
            let html = `<p class="text-blue-400 mb-2"><i class="fas fa-info-circle mr-2"></i>検索結果:</p>`;
            html += `<p class="text-gray-300">Bot Client ID: ${data.botClientId}</p>`;
            html += `<p class="text-gray-300">見つかったコマンド数: ${data.totalCommands}</p>`;
            html += `<p class="${data.aankoFound ? 'text-green-400' : 'text-red-400'}">aanko コマンド: ${data.aankoFound ? '見つかりました' : '見つかりません'}</p>`;
            
            if (data.allCommands.length > 0) {
                html += `<p class="text-gray-400 mt-2">全コマンド:</p><ul class="text-xs text-gray-500">`;
                data.allCommands.forEach(cmd => {
                    html += `<li>${cmd.name} (app: ${cmd.application_id})</li>`;
                });
                html += `</ul>`;
            }
            
            if (data.aankoCommand) {
                html += `<p class="text-green-400 mt-2">aanko詳細: ID=${data.aankoCommand.id}, Version=${data.aankoCommand.version}</p>`;
            } else {
                html += `<p class="text-yellow-400 mt-2">⚠️ Botをインストールしていない可能性があります。招待リンクからBotをインストールしてください。</p>`;
            }
            
            resultText.innerHTML = html;
        } else {
            resultText.innerHTML = `<p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${data.error}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
        resultDiv.classList.remove('hidden');
        resultText.innerHTML = `<p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search mr-2"></i>/aanko コマンドを検索（デバッグ）';
    }
}

async function testToken() {
    const token = document.getElementById('userToken').value.trim();
    const channelId = document.getElementById('testChannelId').value.trim();
    
    if (!token) {
        showToast('トークンを入力してください', 'error');
        return;
    }
    
    if (!channelId) {
        showToast('チャンネルIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('testTokenBtn');
    const resultDiv = document.getElementById('testResult');
    const resultText = document.getElementById('testResultText');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>送信中...';
    resultDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/api/test-send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                channelId,
                message: 'デフォルト2'
            })
        });
        
        const data = await response.json();
        
        resultDiv.classList.remove('hidden');
        
        if (data.success) {
            resultText.innerHTML = `
                <p class="text-green-400"><i class="fas fa-check-circle mr-2"></i>トークンは正常に動作しています！メッセージを送信しました。</p>
            `;
            showToast('テスト成功！メッセージを送信しました');
        } else {
            resultText.innerHTML = `
                <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${data.error}</p>
            `;
            showToast('テスト失敗', 'error');
        }
    } catch (error) {
        console.error('Error testing token:', error);
        resultDiv.classList.remove('hidden');
        resultText.innerHTML = `
            <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${error.message}</p>
        `;
        showToast('テスト失敗', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>「こんにちは」を送信してテスト';
    }
}

async function checkChannelPermissions() {
    const tokens = document.getElementById('userToken').value.trim().split('\n').filter(t => t.trim());
    const guildId = document.getElementById('guildId').value.trim();
    
    if (tokens.length === 0) {
        showToast('トークンを入力してください', 'error');
        return;
    }
    
    if (!guildId) {
        showToast('サーバーIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('checkPermissionsBtn');
    const resultDiv = document.getElementById('externalTestResult');
    const resultText = document.getElementById('externalTestResultText');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>チェック中...';
    resultDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/api/check-channel-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: tokens[0],
                guildId
            })
        });
        
        const data = await response.json();
        
        resultDiv.classList.remove('hidden');
        
        if (data.success) {
            let html = `
                <div class="mb-4">
                    <p class="text-white font-bold mb-2">
                        <i class="fas fa-user mr-2"></i>ユーザー: ${data.user.username}
                        ${data.isAdmin ? '<span class="text-purple-400 ml-2">(管理者)</span>' : ''}
                    </p>
                    <div class="grid grid-cols-4 gap-2 text-center">
                        <div class="bg-green-500/20 rounded-lg p-2">
                            <p class="text-green-400 text-xl font-bold">${data.summary.ok}</p>
                            <p class="text-gray-400 text-xs">使用可能</p>
                        </div>
                        <div class="bg-yellow-500/20 rounded-lg p-2">
                            <p class="text-yellow-400 text-xl font-bold">${data.summary.noView}</p>
                            <p class="text-gray-400 text-xs">閲覧不可</p>
                        </div>
                        <div class="bg-orange-500/20 rounded-lg p-2">
                            <p class="text-orange-400 text-xl font-bold">${data.summary.noSend || 0}</p>
                            <p class="text-gray-400 text-xs">送信不可</p>
                        </div>
                        <div class="bg-red-500/20 rounded-lg p-2">
                            <p class="text-red-400 text-xl font-bold">${data.summary.noAppCommands}</p>
                            <p class="text-gray-400 text-xs">コマンド不可</p>
                        </div>
                    </div>
                </div>
                <div class="space-y-1">
            `;
            
            for (const ch of data.channels) {
                let statusClass, statusIcon;
                if (ch.status === 'ok') {
                    statusClass = 'text-green-400';
                    statusIcon = 'fa-check-circle';
                } else if (ch.status === 'no_view') {
                    statusClass = 'text-yellow-400';
                    statusIcon = 'fa-eye-slash';
                } else if (ch.status === 'no_send') {
                    statusClass = 'text-orange-400';
                    statusIcon = 'fa-comment-slash';
                } else {
                    statusClass = 'text-red-400';
                    statusIcon = 'fa-ban';
                }
                
                let slowModeIndicator = '';
                if (ch.slowMode && ch.slowMode > 0 && ch.status === 'ok') {
                    slowModeIndicator = `<span class="text-blue-400 text-xs ml-2"><i class="fas fa-clock mr-1"></i>${ch.slowMode}s</span>`;
                }
                
                let everyoneIndicator = '';
                if (ch.status === 'ok') {
                    if (ch.canMentionEveryone) {
                        everyoneIndicator = `<span class="text-yellow-400 text-xs ml-2" title="@everyone使用可能"><i class="fas fa-bullhorn"></i></span>`;
                    } else {
                        everyoneIndicator = `<span class="text-gray-500 text-xs ml-2" title="@everyone使用不可"><i class="fas fa-bullhorn"></i></span>`;
                    }
                }
                
                html += `
                    <div class="flex items-center justify-between py-1 border-b border-white/10">
                        <span class="text-gray-300">
                            <i class="fas fa-hashtag mr-1 text-gray-500"></i>${ch.name}${slowModeIndicator}${everyoneIndicator}
                        </span>
                        <span class="${statusClass}">
                            <i class="fas ${statusIcon} mr-1"></i>
                            ${ch.reason || '使用可能'}
                        </span>
                    </div>
                `;
            }
            
            html += '</div>';
            resultText.innerHTML = html;
            showToast(`${data.summary.ok}/${data.summary.total} チャンネルで使用可能`);
        } else {
            resultText.innerHTML = `
                <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${data.error}</p>
            `;
            showToast('チェック失敗', 'error');
        }
    } catch (error) {
        console.error('Error checking permissions:', error);
        resultDiv.classList.remove('hidden');
        resultText.innerHTML = `
            <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${error.message}</p>
        `;
        showToast('チェック失敗', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shield-alt mr-2"></i>全チャンネルの権限をチェック';
    }
}

let isAankoRunning = false;
let shouldStopAanko = false;
let aankoAbortController = null;

function setMentionCountAll() {
    const userIdsText = document.getElementById('aankoUserIds').value.trim();
    const userIds = userIdsText
        .split(/[\s,\n]+/)
        .map(id => id.trim())
        .filter(id => id && /^\d+$/.test(id));
    
    if (userIds.length === 0) {
        showToast('先にユーザーIDを入力してください', 'error');
        return;
    }
    
    document.getElementById('aankoMentionCount').value = userIds.length;
    showToast(`メンション人数を ${userIds.length} 人に設定しました`);
}

async function fetchAllTextChannels() {
    const token = document.getElementById('userToken').value.trim();
    const guildId = document.getElementById('guildId').value.trim();
    
    if (!token) {
        showToast('トークンを入力してください', 'error');
        return;
    }
    
    if (!guildId) {
        showToast('サーバーIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('fetchChannelsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>取得中...';
    
    try {
        const response = await fetch('/api/get-text-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, guildId, skipFilter: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const channelIds = data.channels.map(c => c.id).join(', ');
            document.getElementById('aankoChannelIds').value = channelIds;
            showToast(`${data.channels.length} 個のテキストチャンネルを取得しました（フィルターなし）`);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error fetching channels:', error);
        showToast('チャンネル取得に失敗しました: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-hashtag mr-1"></i>サーバーの全チャンネルを取得';
    }
}

async function stopAankoCommand() {
    shouldStopAanko = true;
    if (aankoAbortController) {
        aankoAbortController.abort();
    }
    
    // Also cancel server-side operation
    try {
        await fetch('/api/cancel-direct-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.log('Cancel request error:', e);
    }
    
    showToast('停止リクエストを送信しました...');
}

async function executeAankoCommand() {
    const tokensText = document.getElementById('userToken').value.trim();
    const channelIdsText = document.getElementById('aankoChannelIds').value.trim();
    const userIdsText = document.getElementById('aankoUserIds').value.trim();
    const mentionCount = parseInt(document.getElementById('aankoMentionCount').value) || 0;
    let message = document.getElementById('aankoMessage').value.trim() || null;
    const perChannelCount = parseInt(document.getElementById('aankoPerChannelCount').value) || 5;
    const totalCount = parseInt(document.getElementById('aankoExecuteCount').value) || 0;
    const delaySeconds = parseFloat(document.getElementById('aankoDelaySeconds').value) || 0.01;
    const delayMs = Math.max(delaySeconds * 1000, 10);
    const includeRandomChars = document.getElementById('aankoRandomChars')?.checked ?? true;
    const includeEveryone = document.getElementById('aankoEveryone')?.checked ?? false;
    
    if (includeEveryone) {
        message = '@everyone ' + (message || '');
    }
    
    let tokens = [];
    if (tokensText) {
        tokens = tokensText.split(/[\n]+/).map(t => t.trim()).filter(t => t.length > 20);
    }
    
    if (tokens.length === 0) {
        showToast('トークンを入力してください', 'error');
        return;
    }
    
    if (!channelIdsText) {
        showToast('チャンネルIDを入力してください', 'error');
        return;
    }
    
    const channelIds = channelIdsText
        .split(/[\s,\n]+/)
        .map(id => id.trim())
        .filter(id => id && /^\d+$/.test(id));
    
    if (channelIds.length === 0) {
        showToast('有効なチャンネルIDを入力してください', 'error');
        return;
    }
    
    const userIds = userIdsText
        .split(/[\s,\n]+/)
        .map(id => id.trim())
        .filter(id => id && /^\d+$/.test(id));
    
    const btn = document.getElementById('aankoExecuteBtn');
    const stopBtn = document.getElementById('aankoStopBtn');
    const progressDiv = document.getElementById('aankoProgress');
    const progressText = document.getElementById('aankoProgressText');
    const resultDiv = document.getElementById('aankoExecuteResult');
    const resultText = document.getElementById('aankoResultText');
    
    isAankoRunning = true;
    shouldStopAanko = false;
    aankoAbortController = new AbortController();
    btn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    progressText.textContent = `${tokens.length}トークン x ${channelIds.length}チャンネル 送信中... (各チャンネル${perChannelCount}回, 間隔${delaySeconds}秒${totalCount > 0 ? `, 上限${totalCount}` : ''})`;
    
    try {
        const response = await fetch('/api/send-dm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokens,
                channelIds,
                userIds,
                mentionCount,
                message,
                count: perChannelCount,
                totalCount: totalCount,
                delayMs,
                includeRandomChars
            }),
            signal: aankoAbortController.signal
        });
        
        const data = await response.json();
        
        resultDiv.classList.remove('hidden');
        if (data.success) {
            resultText.innerHTML = `
                <p class="text-green-400 mb-2"><i class="fas fa-check-circle mr-2"></i>完了！</p>
                <p class="text-gray-400">トークン数: ${data.tokenCount || tokens.length} | チャンネル数: ${data.channelCount || channelIds.length}</p>
                <p class="text-gray-400">成功: ${data.success} | 失敗: ${data.failed}</p>
                <p class="text-blue-400 text-sm mt-2">トークン直接送信完了</p>
            `;
            showToast(`送信完了: 成功${data.success} 失敗${data.failed}`);
        } else {
            throw new Error(data.error || '送信に失敗しました');
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            resultDiv.classList.remove('hidden');
            resultText.innerHTML = `<p class="text-yellow-400"><i class="fas fa-stop-circle mr-2"></i>停止しました</p>`;
            showToast('処理を停止しました');
        } else {
            console.error('Error executing send:', error);
            resultDiv.classList.remove('hidden');
            resultText.innerHTML = `
                <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${error.message}</p>
            `;
            showToast('実行に失敗しました', 'error');
        }
    } finally {
        isAankoRunning = false;
        shouldStopAanko = false;
        aankoAbortController = null;
        btn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        progressDiv.classList.add('hidden');
    }
}

let isAheButtonRunning = false;
let shouldStopAheButton = false;
let aheButtonAbortController = null;

async function createAheButtonAndClick() {
    const tokensText = document.getElementById('userToken').value.trim();
    const guildId = document.getElementById('guildId').value.trim();
    const channelIdsText = document.getElementById('aheButtonChannelIds').value.trim();
    let channelIds = channelIdsText.split(/[,\n\s]+/).map(id => id.trim()).filter(id => /^\d{17,19}$/.test(id));
    const clickCount = parseInt(document.getElementById('aheButtonClickCount').value) || 1;
    const clicksPerChannel = Math.max(1, parseInt(document.getElementById('aheClicksPerChannel').value) || 1);
    let message = document.getElementById('aheButtonMessage').value.trim() || null;
    const userIdsText = document.getElementById('aheButtonUserIds').value.trim();
    const userIds = userIdsText ? userIdsText.split(/[,\n\s]+/).map(id => id.trim()).filter(id => /^\d{17,19}$/.test(id)) : [];
    const includeEveryone = document.getElementById('aheButtonEveryone')?.checked ?? false;
    const randLen = Math.min(64, Math.max(1, parseInt(document.getElementById('aheRandLen').value) || 64));
    const dmUserId = document.getElementById('aheDmUserId')?.value.trim() || '';
    
    let mentionCount = parseInt(document.getElementById('aheButtonMentionCount').value) || 0;
    if (userIds.length > 0 && mentionCount === 0) {
        mentionCount = userIds.length;
        console.log(`[createAheButtonAndClick] Auto-set mentionCount to ${mentionCount} based on userIds`);
    }
    
    let tokens = [];
    if (tokensText) {
        tokens = tokensText.split(/[\n]+/).map(t => t.trim()).filter(t => t.length > 20);
    }
    
    if (tokens.length === 0) {
        showToast('ユーザートークンを入力してください', 'error');
        return;
    }
    
    let isDmMode = false;
    if (dmUserId && /^\d{17,19}$/.test(dmUserId)) {
        isDmMode = true;
        channelIds = [];
    } else if (channelIds.length === 0) {
        showToast('チャンネルIDまたはDM送信先ユーザーIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('aheButtonExecuteBtn');
    const stopBtn = document.getElementById('aheButtonStopBtn');
    const progressDiv = document.getElementById('aheButtonProgress');
    const progressText = document.getElementById('aheButtonProgressText');
    const resultDiv = document.getElementById('aheButtonResult');
    const resultText = document.getElementById('aheButtonResultText');
    
    isAheButtonRunning = true;
    shouldStopAheButton = false;
    aheButtonAbortController = new AbortController();
    
    btn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    try {
        let totalClicksSent = 0;
        let totalButtonsCreated = 0;
        
        for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
            if (shouldStopAheButton) break;
            
            const token = tokens[tokenIndex];
            let targetChannelIds = isDmMode ? [] : channelIds;
            
            if (isDmMode) {
                progressText.textContent = `トークン ${tokenIndex + 1}/${tokens.length}: DM チャンネル作成中...`;
                
                try {
                    const dmResponse = await fetch('/api/create-dm-channel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, userId: dmUserId }),
                        signal: aheButtonAbortController.signal
                    });
                    
                    const dmResult = await dmResponse.json();
                    
                    if (dmResult.success) {
                        targetChannelIds = [dmResult.channelId];
                        console.log(`Token ${tokenIndex + 1}: DM channel created: ${dmResult.channelId}`);
                    } else {
                        console.log(`Token ${tokenIndex + 1}: DM channel creation failed: ${dmResult.error}`);
                        showToast(`DM作成失敗: ${dmResult.error}`, 'error');
                        continue;
                    }
                } catch (e) {
                    if (e.name === 'AbortError') throw e;
                    console.error(`Token ${tokenIndex + 1}: DM creation error: ${e.message}`);
                    showToast(`DMエラー: ${e.message}`, 'error');
                    continue;
                }
            }
            
            // Generate operationId for progress tracking
            const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            progressText.innerHTML = `<span class="text-yellow-400">🔄 実行中</span> - トークン ${tokenIndex + 1}/${tokens.length}<br><span class="text-gray-400">📦 ボタン作成準備中...</span>`;
            
            try {
                // Start polling for progress
                let pollInterval = setInterval(async () => {
                    try {
                        const progressResponse = await fetch(`/api/operation-progress/${operationId}`);
                        const progressData = await progressResponse.json();
                        if (progressData.success && progressData.status) {
                            let phaseIcon = progressData.phase === 'creating' ? '📦' : '🖱️';
                            let statusColor = progressData.lastError ? 'text-orange-400' : 'text-blue-400';
                            let errorText = progressData.lastError ? `<br><span class="text-red-400 text-xs">エラー: ${progressData.lastError}</span>` : '';
                            progressText.innerHTML = `<span class="text-yellow-400">🔄 実行中</span> - トークン ${tokenIndex + 1}/${tokens.length}<br><span class="${statusColor}">${phaseIcon} ${progressData.status}</span>${errorText}`;
                        }
                    } catch (e) {}
                }, 400);
                
                // Start API call with operationId
                const createResponse = await fetch('/api/ahe-instant-parallel-button', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token,
                        channelIds: targetChannelIds,
                        clickCount,
                        clicksPerChannel,
                        guildId: isDmMode ? null : (guildId || null),
                        message: message || null,
                        userIds: userIds.length > 0 ? userIds : null,
                        mentionCount,
                        includeEveryone,
                        randLen,
                        operationId
                    }),
                    signal: aheButtonAbortController.signal
                });
                
                const createResult = await createResponse.json();
                
                // Stop polling
                clearInterval(pollInterval);
                
                if (createResult.success) {
                    totalButtonsCreated += createResult.buttonsCreated || 0;
                    totalClicksSent += createResult.clicksSent || 0;
                    progressText.innerHTML = `<span class="text-green-400">✅ 完了</span> - トークン ${tokenIndex + 1}/${tokens.length}<br><span class="text-gray-400">ボタン: ${createResult.buttonsCreated}個, クリック: ${createResult.clicksSent}回</span>`;
                    console.log(`Token ${tokenIndex + 1}: Created ${createResult.buttonsCreated} buttons, sent ${createResult.clicksSent} clicks`);
                } else {
                    console.log(`Token ${tokenIndex + 1}: Failed - ${createResult.error}`);
                    continue;
                }
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                console.error(`Token ${tokenIndex + 1}: Error - ${e.message}`);
                continue;
            }
        }
        
        resultDiv.classList.remove('hidden');
        resultText.innerHTML = `
            <p class="text-green-400 mb-2"><i class="fas fa-bolt mr-2"></i>/ahe 処理完了！</p>
            <p class="text-gray-400">${isDmMode ? 'DM送信先: ' + dmUserId : 'チャンネル数: ' + channelIds.length}</p>
            <p class="text-gray-400">トークン数: ${tokens.length}</p>
            <p class="text-gray-400">総クリック回数: ${clickCount}</p>
            <p class="text-gray-400">${isDmMode ? '' : 'チャンネル毎クリック: ' + clicksPerChannel}</p>
            <p class="text-gray-400">ランダム文字数: ${randLen}</p>
            <p class="text-gray-400">作成ボタン合計: ${totalButtonsCreated}個</p>
            <p class="text-gray-400">送信クリック合計: ${totalClicksSent}回</p>
        `;
        showToast(`/ahe 処理完了! ${totalClicksSent}クリック発射`);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            resultDiv.classList.remove('hidden');
            resultText.innerHTML = `<p class="text-yellow-400"><i class="fas fa-stop-circle mr-2"></i>停止しました</p>`;
            showToast('処理を停止しました');
        } else {
            console.error('Error creating ahe button and clicking:', error);
            resultDiv.classList.remove('hidden');
            resultText.innerHTML = `
                <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${error.message}</p>
            `;
            showToast('実行に失敗しました', 'error');
        }
    } finally {
        isAheButtonRunning = false;
        shouldStopAheButton = false;
        aheButtonAbortController = null;
        btn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        progressDiv.classList.add('hidden');
    }
}

async function stopAheButtonClick() {
    shouldStopAheButton = true;
    if (aheButtonAbortController) {
        aheButtonAbortController.abort();
    }
    
    // Also cancel server-side operation
    try {
        await fetch('/api/cancel-ahe-button', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.log('Cancel request error:', e);
    }
    
    showToast('/ahe 停止中...', 'warning');
}

async function fetchAllTextChannelsForAhe() {
    const token = document.getElementById('userToken').value.trim();
    const guildId = document.getElementById('guildId').value.trim();
    
    if (!token) {
        showToast('ユーザートークンを入力してください', 'error');
        return;
    }
    
    if (!guildId || !/^\d{17,19}$/.test(guildId)) {
        showToast('有効なサーバーIDを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('fetchChannelsBtnAhe');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>取得中...';
    
    try {
        // Use externalAppsOnly=true to get channels where external apps are allowed
        // (even if app commands are not allowed)
        const response = await fetch('/api/get-text-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, guildId, externalAppsOnly: true })
        });
        
        const data = await response.json();
        
        if (data.success && data.channels.length > 0) {
            const channelIds = data.channels.map(ch => ch.id).join('\n');
            document.getElementById('aheButtonChannelIds').value = channelIds;
            showToast(`${data.channels.length}個のチャンネルを取得しました！（外部アプリ許可チャンネル）`);
        } else {
            showToast('チャンネルが見つかりませんでした', 'error');
        }
    } catch (error) {
        console.error('Error fetching channels:', error);
        showToast('チャンネル取得に失敗しました', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function setMentionCountAllAhe() {
    const userIdsText = document.getElementById('aheButtonUserIds').value.trim();
    const userIds = userIdsText ? userIdsText.split(/[,\n\s]+/).map(id => id.trim()).filter(id => /^\d{17,19}$/.test(id)) : [];
    document.getElementById('aheButtonMentionCount').value = userIds.length || 1;
}

let fetchedChannels = [];

async function autoFetchChannels() {
    const token = document.getElementById('userToken').value.trim();
    const guildId = document.getElementById('guildId').value.trim();
    
    if (!token || !guildId || !/^\d{17,19}$/.test(guildId)) {
        return;
    }
    
    const statusEl = document.getElementById('channelFetchStatus');
    
    if (statusEl) statusEl.textContent = 'チャンネル取得中...';
    
    try {
        const response = await fetch('/api/get-text-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, guildId })
        });
        
        const data = await response.json();
        
        if (data.success && data.channels.length > 0) {
            fetchedChannels = data.channels;
            
            const channelInput = document.getElementById('aankoChannelIds');
            if (channelInput && !channelInput.value.trim()) {
                const channelIds = data.channels.map(c => c.id).join(', ');
                channelInput.value = channelIds;
            }
            
            if (statusEl) statusEl.textContent = `${data.channels.length} 個のチャンネルを取得しました`;
            showToast(`${data.channels.length} 個のチャンネルを自動取得しました`);
        } else {
            if (statusEl) statusEl.textContent = 'チャンネルが見つかりません';
        }
    } catch (error) {
        console.log('Auto channel fetch failed:', error.message);
        if (statusEl) statusEl.textContent = 'チャンネル取得失敗';
    }
}

let previousGuildId = '';

function clearServerRelatedFields() {
    const aankoChannelIds = document.getElementById('aankoChannelIds');
    if (aankoChannelIds) aankoChannelIds.value = '';
    const aankoUserIds = document.getElementById('aankoUserIds');
    if (aankoUserIds) aankoUserIds.value = '';
    const testChannelId = document.getElementById('testChannelId');
    if (testChannelId) testChannelId.value = '';
    
    const aheChannelIds = document.getElementById('aheButtonChannelIds');
    if (aheChannelIds) aheChannelIds.value = '';
    const aheUserIds = document.getElementById('aheButtonUserIds');
    if (aheUserIds) aheUserIds.value = '';
    
    currentMembers = [];
    const storedMemberCount = document.getElementById('storedMemberCount');
    if (storedMemberCount) {
        storedMemberCount.innerHTML = '<i class="fas fa-database mr-2"></i>0 人取得済み';
    }
    
    const testResult = document.getElementById('testResult');
    if (testResult) testResult.classList.add('hidden');
    const externalTestResult = document.getElementById('externalTestResult');
    if (externalTestResult) externalTestResult.classList.add('hidden');
    const aankoExecuteResult = document.getElementById('aankoExecuteResult');
    if (aankoExecuteResult) aankoExecuteResult.classList.add('hidden');
    const aheButtonResult = document.getElementById('aheButtonResult');
    if (aheButtonResult) aheButtonResult.classList.add('hidden');
    
    fetchedChannels = [];
}

function toggleGroupDmMessageContainer() {
    const sendMessageCheckbox = document.getElementById('groupDmSendMessage');
    const messageContainer = document.getElementById('groupDmMessageContainer');
    if (sendMessageCheckbox && messageContainer) {
        if (sendMessageCheckbox.checked) {
            messageContainer.classList.remove('hidden');
        } else {
            messageContainer.classList.add('hidden');
        }
    }
}

let isGroupDmRunning = false;
let shouldStopGroupDm = false;

function stopGroupDmCreation() {
    shouldStopGroupDm = true;
    showToast('停止リクエストを送信しました...');
}

async function createGroupDmBatch() {
    if (isGroupDmRunning) {
        showToast('既に実行中です', 'error');
        return;
    }
    
    const tokens = document.getElementById('userToken').value.trim().split('\n').filter(t => t.trim());
    const friendIdsText = document.getElementById('groupDmFriendIds').value.trim();
    const groupName = document.getElementById('groupDmName').value.trim();
    const groupIcon = document.getElementById('groupDmIcon').value.trim();
    const sendMessage = document.getElementById('groupDmSendMessage').checked;
    const autoLeave = document.getElementById('groupDmAutoLeave').checked;
    const message = document.getElementById('groupDmMessage').value.trim();
    const repeatCount = Math.max(1, parseInt(document.getElementById('groupDmRepeatCount').value) || 1);
    const delaySeconds = parseFloat(document.getElementById('groupDmDelaySeconds').value) || 0.5;
    const delayMs = Math.max(delaySeconds * 1000, 10);
    
    if (tokens.length === 0) {
        showToast('トークンを入力してください', 'error');
        return;
    }
    
    if (!friendIdsText) {
        showToast('フレンドIDを入力してください', 'error');
        return;
    }
    
    const friendIds = friendIdsText
        .split(/[\s,\n]+/)
        .map(id => id.trim())
        .filter(id => /^\d{17,19}$/.test(id));
    
    if (friendIds.length < 2) {
        showToast('フレンドIDを2人以上指定してください', 'error');
        return;
    }
    
    if (sendMessage && !message) {
        showToast('お知らせメッセージを入力してください', 'error');
        return;
    }
    
    const btn = document.getElementById('createGroupDmBtn');
    const stopBtn = document.getElementById('stopGroupDmBtn');
    const progressDiv = document.getElementById('groupDmProgress');
    const progressText = document.getElementById('groupDmProgressText');
    const progressBar = document.getElementById('groupDmProgressBar');
    const resultDiv = document.getElementById('groupDmResult');
    const resultText = document.getElementById('groupDmResultText');
    
    isGroupDmRunning = true;
    shouldStopGroupDm = false;
    btn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    let successCount = 0;
    let failCount = 0;
    const createdGroups = [];
    
    try {
        for (let i = 0; i < repeatCount; i++) {
            if (shouldStopGroupDm) {
                break;
            }
            
            const currentProgress = ((i + 1) / repeatCount) * 100;
            progressText.textContent = `${i + 1} / ${repeatCount}`;
            progressBar.style.width = `${currentProgress}%`;
            
            try {
                const response = await fetch('/api/create-group-dm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: tokens[0],
                        recipientIds: friendIds,
                        groupName: groupName || null,
                        groupIcon: groupIcon || null,
                        sendMessage: sendMessage,
                        message: message || null,
                        autoLeave: autoLeave
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    successCount++;
                    createdGroups.push(data.channelId);
                } else {
                    failCount++;
                    console.log(`Group DM creation ${i + 1} failed:`, data.error);
                }
            } catch (error) {
                failCount++;
                console.error(`Group DM creation ${i + 1} error:`, error.message);
            }
            
            if (i < repeatCount - 1 && !shouldStopGroupDm) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        resultDiv.classList.remove('hidden');
        
        if (shouldStopGroupDm) {
            resultText.innerHTML = `
                <p class="text-yellow-400 mb-2"><i class="fas fa-stop-circle mr-2"></i>停止しました</p>
                <p class="text-gray-300">成功: <span class="text-green-400">${successCount}</span> / 失敗: <span class="text-red-400">${failCount}</span></p>
                ${createdGroups.length > 0 ? `<p class="text-gray-400 text-xs mt-2">作成されたグループID: ${createdGroups.slice(0, 5).join(', ')}${createdGroups.length > 5 ? '...' : ''}</p>` : ''}
            `;
            showToast('処理を停止しました');
        } else {
            resultText.innerHTML = `
                <p class="text-green-400 mb-2"><i class="fas fa-check-circle mr-2"></i>完了！</p>
                <p class="text-gray-300">作成回数: ${repeatCount}回</p>
                <p class="text-gray-300">成功: <span class="text-green-400">${successCount}</span> / 失敗: <span class="text-red-400">${failCount}</span></p>
                ${createdGroups.length > 0 ? `<p class="text-gray-400 text-xs mt-2">作成されたグループID: ${createdGroups.slice(0, 5).join(', ')}${createdGroups.length > 5 ? '...' : ''}</p>` : ''}
                <button onclick="copyToClipboard('${createdGroups.join('\\n')}', 'グループIDをコピーしました！')" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                    <i class="fas fa-copy mr-1"></i>全グループIDをコピー
                </button>
            `;
            showToast(`グループDM作成完了: 成功${successCount} 失敗${failCount}`);
        }
    } catch (error) {
        console.error('Error in batch group DM creation:', error);
        resultDiv.classList.remove('hidden');
        resultText.innerHTML = `
            <p class="text-red-400"><i class="fas fa-times-circle mr-2"></i>エラー: ${error.message}</p>
        `;
        showToast('グループDM作成失敗', 'error');
    } finally {
        isGroupDmRunning = false;
        shouldStopGroupDm = false;
        btn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        progressDiv.classList.add('hidden');
    }
}

async function leaveGuild() {
    const token = document.getElementById('userToken').value.trim();
    const guildId = document.getElementById('guildId').value.trim();
    
    if (!token) {
        showToast('ユーザートークンを入力してください', 'error');
        return;
    }
    
    if (!guildId || !/^\d{17,19}$/.test(guildId)) {
        showToast('有効なサーバーIDを入力してください', 'error');
        return;
    }
    
    if (!confirm(`サーバーID: ${guildId} から退出しますか？\nこの操作は元に戻せません。`)) {
        return;
    }
    
    const btn = document.getElementById('leaveGuildBtn');
    const resultDiv = document.getElementById('leaveGuildResult');
    const resultText = document.getElementById('leaveGuildResultText');
    const originalBtnText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>退出中...';
    
    try {
        const tokens = token.split(/[\n]+/).map(t => t.trim()).filter(t => t.length > 20);
        let successCount = 0;
        let failCount = 0;
        
        for (const t of tokens) {
            try {
                const response = await fetch('/api/leave-guild', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: t, guildId })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    successCount++;
                } else {
                    failCount++;
                    const errorMsg = result.error || `HTTP ${response.status}`;
                    console.log(`Leave failed for token: ${errorMsg}`);
                }
            } catch (e) {
                failCount++;
                console.error(`Leave error: ${e.message}`);
            }
        }
        
        resultDiv.classList.remove('hidden');
        if (successCount > 0) {
            resultText.innerHTML = `<span class="text-green-400"><i class="fas fa-check-circle mr-1"></i>退出成功: ${successCount}/${tokens.length}</span>`;
            showToast(`サーバーから退出しました (${successCount}/${tokens.length})`);
        } else {
            resultText.innerHTML = `<span class="text-red-400"><i class="fas fa-times-circle mr-1"></i>退出失敗: ${failCount}/${tokens.length}</span>`;
            showToast('サーバー退出に失敗しました', 'error');
        }
        
    } catch (error) {
        console.error('Error leaving guild:', error);
        resultDiv.classList.remove('hidden');
        resultText.innerHTML = `<span class="text-red-400"><i class="fas fa-times-circle mr-1"></i>エラー: ${error.message}</span>`;
        showToast('サーバー退出に失敗しました', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const guildIdInput = document.getElementById('guildId');
    if (guildIdInput) {
        previousGuildId = guildIdInput.value.trim();
    }
    
    if (guildIdInput) {
        guildIdInput.addEventListener('input', function() {
            const currentGuildId = this.value.trim();
            
            if (/^\d{17,19}$/.test(currentGuildId) && currentGuildId !== previousGuildId) {
                console.log('Server ID changed, clearing related fields');
                clearServerRelatedFields();
                previousGuildId = currentGuildId;
            }
        });
        
        guildIdInput.addEventListener('blur', function() {
            const currentGuildId = this.value.trim();
            if (/^\d{17,19}$/.test(currentGuildId) && currentGuildId !== previousGuildId) {
                console.log('Server ID changed (blur), clearing related fields');
                clearServerRelatedFields();
                previousGuildId = currentGuildId;
            }
        });
    }
    
    const sendMessageCheckbox = document.getElementById('groupDmSendMessage');
    if (sendMessageCheckbox) {
        sendMessageCheckbox.addEventListener('change', toggleGroupDmMessageContainer);
    }
});
