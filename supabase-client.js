// Supabase 설정 - Vercel 환경 변수 또는 기본값 사용
const SUPABASE_URL = 'https://qmhmrbvrrziesfdjanaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaG1yYnZycnppZXNmZGphbmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4Nzc0MjYsImV4cCI6MjA4NTQ1MzQyNn0.sLguWRwyeNtN8VMjwHHbrIGdF1vUmTjD8jwbfDU7xps';

let supabaseClient = null;

// Supabase 클라이언트 초기화
function initSupabase() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase가 설정되지 않았습니다. 리더보드 기능이 비활성화됩니다.');
        return false;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    } catch (error) {
        console.error('Supabase 초기화 실패:', error);
        return false;
    }
}

// 점수 저장
async function saveScore(playerName, score, level, lines) {
    if (!supabaseClient && !initSupabase()) {
        alert('Supabase가 설정되지 않아 점수를 저장할 수 없습니다.');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('scores')
            .insert([
                {
                    player_name: playerName,
                    score: score,
                    level: level,
                    lines: lines
                }
            ]);
        
        if (error) throw error;
        
        console.log('점수 저장 성공:', data);
        return true;
    } catch (error) {
        console.error('점수 저장 실패:', error);
        alert('점수 저장에 실패했습니다: ' + error.message);
        return false;
    }
}

// 리더보드 불러오기
async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    
    if (!supabaseClient && !initSupabase()) {
        leaderboardList.innerHTML = '<p class="loading">Supabase 설정이 필요합니다.<br>README.md를 참고하세요.</p>';
        return;
    }
    
    leaderboardList.innerHTML = '<p class="loading">로딩 중...</p>';
    
    try {
        const { data, error } = await supabaseClient
            .from('scores')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            leaderboardList.innerHTML = '<p class="loading">아직 등록된 점수가 없습니다.</p>';
            return;
        }
        
        leaderboardList.innerHTML = data.map((item, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${escapeHtml(item.player_name)}</div>
                    <div class="leaderboard-stats">레벨 ${item.level} · ${item.lines} 라인</div>
                </div>
                <div class="leaderboard-score">${item.score.toLocaleString()}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('리더보드 로드 실패:', error);
        leaderboardList.innerHTML = `<p class="loading">리더보드를 불러올 수 없습니다.<br>${error.message}</p>`;
    }
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 페이지 로드 시 Supabase 초기화 (선택적)
// Supabase CDN이 로드되지 않아도 게임은 정상 작동합니다
setTimeout(() => {
    if (typeof supabase !== 'undefined') {
        initSupabase();
    } else {
        console.log('Supabase를 사용하지 않는 모드로 실행됩니다.');
    }
}, 100);
