// js/views/playlist.js 전체 수정
import { state, saveLikedSongsToCookie } from '../storage.js';
import { openModal } from '../components/modal.js';
import { renderHome } from './home.js';

export function toggleHeart(id) { 
    const song = state.songs.find(s => s.id === id);
    if(song) {
        if(!song.liked) {
            song.hearts++; 
            song.liked = true; 
        } else {
            song.hearts--;
            song.liked = false;
        }
        saveLikedSongsToCookie();
        renderSongs(); 
        renderHome();
    }
}

export function renderSongs() {
    const list = document.getElementById('song-list');
    if (!list) return;
    list.innerHTML = '';
    
    // 하트 순 정렬을 지우고, 이름 순서(오름차순) 정렬 보장
    const sortedSongs = [...state.songs].sort((a, b) => a.title.localeCompare(b.title, 'ko'));

    sortedSongs.forEach((song, i) => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-md";
        const heartStyle = song.liked ? "text-sunset-orange font-bold animate-bounce" : "hover:text-sunset-orange text-gray-400 transition";

        div.innerHTML = `
            <div class="flex items-center gap-6">
                <span class="text-2xl font-black text-gray-700 w-8">${i + 1}</span>
                <div class="text-left">
                    <h4 class="font-bold text-lg">${song.title}</h4>
                    <p class="text-sm text-gray-400">${song.artist}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button data-id="${song.id}" class="heart-btn ${heartStyle}">♥ ${song.hearts}</button>
                <button data-id="${song.id}" class="playlist-play-btn bg-gray-800 px-4 py-2 rounded text-sm font-bold hover:bg-sunset-orange transition">PLAY</button>
            </div>`;
            
        div.querySelector('.heart-btn').addEventListener('click', (e) => toggleHeart(parseInt(e.target.dataset.id)));
        div.querySelector('.playlist-play-btn').addEventListener('click', (e) => openModal(parseInt(e.target.dataset.id)));
        list.appendChild(div);
    });
}