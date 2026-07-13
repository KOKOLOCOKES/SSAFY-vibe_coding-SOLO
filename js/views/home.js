import { state } from '../storage.js';
import { openModal } from '../components/modal.js';

export function renderRecentComments() {
    const container = document.getElementById('recent-comments');
    if(!container) return;
    
    let allComments = [];
    state.songs.forEach(s => s.comments.forEach(c => allComments.push({songId: s.id, song: s.title, ...c})));
    
    if (allComments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-2 text-center text-sm py-4">등록된 코멘트가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = allComments.slice(0, 10).map(c => `
        <div class="bg-gray-900 p-4 rounded-lg border border-gray-800 flex justify-between items-center shadow-md">
            <div>
                <p class="text-xs text-sunset-orange font-bold">${c.song}</p>
                <p class="text-sm font-bold mt-1">${c.name} : <span class="text-gray-400 font-normal">${c.text}</span></p>
            </div>
            <button data-id="${c.songId}" class="view-comment-btn bg-gray-800 px-3 py-1 rounded text-xs hover:bg-sunset-orange transition font-bold">보기</button>
        </div>
    `).join('');

    container.querySelectorAll('.view-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.id)));
    });
}

export function renderHome() {
    if (state.songs.length === 0) return;
    const container = document.getElementById('top-5-container');
    if(!container) return;

    const sorted = [...state.songs].sort((a, b) => {
        if (b.hearts !== a.hearts) return b.hearts - a.hearts;
        return a.title.localeCompare(b.title, 'ko');
    }).slice(0, 5);
    
    let html = `
    <div class="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col gap-4 shadow-lg">
        <div class="flex items-center gap-4">
            <div class="flex items-end gap-1"><span class="text-5xl font-black text-sunset-orange">1</span><span class="text-xl font-bold pb-1">위</span></div>
            <div class="text-left">
                <h4 class="font-bold text-xl">${sorted[0].title}</h4>
                <p class="text-gray-400 text-sm">${sorted[0].artist}</p>
            </div>
            <button id="home-rank1-comment" class="ml-auto bg-sunset-orange px-4 py-2 rounded text-sm font-bold shadow hover:bg-orange-600 transition">댓글</button>
        </div>
        <div class="w-full aspect-video"><iframe class="w-full h-full rounded-lg" src="https://www.youtube.com/embed/${sorted[0].videoId}"></iframe></div>
    </div>`;
    
    html += `<div class="space-y-4">` + sorted.slice(1).map((song, idx) => `
        <div class="flex items-center justify-between p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-md">
            <div class="flex items-center gap-4">
                <span class="text-4xl font-black text-gray-700 w-8">${idx + 2}</span>
                <div class="text-left">
                    <h4 class="font-bold">${song.title}</h4>
                    <p class="text-sm text-gray-400">${song.artist}</p>
                </div>
            </div>
            <button data-id="${song.id}" class="home-play-btn bg-gray-800 px-4 py-2 rounded text-sm font-bold hover:bg-sunset-orange transition">PLAY</button>
        </div>`).join('') + `</div>`;
        
    container.innerHTML = html;

    document.getElementById('home-rank1-comment').addEventListener('click', () => openModal(sorted[0].id));
    container.querySelectorAll('.home-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.id)));
    });

    renderRecentComments();
}