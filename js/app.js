import { state, getCookie, getLikedSongsFromCookie, getMyCommentsFromCookie, getYouTubeId } from './storage.js';
import { renderHome } from './views/home.js';
import { renderSongs } from './views/playlist.js';
import { initRecommendTags, initRecommendEvents, resetQuizSession } from './views/recommend.js'; // resetQuizSession 임포트 추가
import { renderMyPage, initMyPageEvents } from './views/mypage.js';
import { initModalEvents } from './components/modal.js';

export function showPage(pageId) {
    // [추가] 사용자가 다른 페이지로 이동할 때, Recommend 페이지의 퀴즈 상태를 결과창 없이 강제 리셋
    if (pageId !== 'recommend') {
        resetQuizSession();
    }

    ['home', 'playlist', 'recommend', 'mypage'].forEach(id => {
        document.getElementById(`page-${id}`).classList.add('hidden');
    });
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    
    if(pageId === 'home') renderHome();
    if(pageId === 'playlist') renderSongs();
    if(pageId === 'mypage') renderMyPage();
}

// js/app.js 내 loadSongsData 함수 수정 부분
async function loadSongsData() {
    try {
        const savedNickname = getCookie("user_nickname");
        if (savedNickname) state.userNickname = savedNickname;
        document.getElementById('nickname-container').innerText = state.userNickname;

        const response = await fetch('songs.json');
        if (!response.ok) throw new Error('데이터 응답에 실패했습니다.');
        const rawData = await response.json();
        
        const cookieLikedSongs = getLikedSongsFromCookie();
        const storedMyComments = getMyCommentsFromCookie();

        // 1. 초기 매핑 시 하트 기본 수치를 0으로 설정
        let mappedSongs = rawData.map((song, index) => {
            const isLikedInCookie = cookieLikedSongs.includes(song["제목"]);
            
            // 기존 랜덤 수치를 제거하고 Default 수치를 0으로 설정 (쿠키에 있으면 1)
            const baseHearts = 0; 

            let initialComments = [];
            if (index < 2) {
                initialComments.push({name: 'Alice', text: '너무 좋아요!', isMyComment: false});
            }
            
            let matchedMyComments = storedMyComments.filter(c => c.songId === (index + 1));
            matchedMyComments.forEach(c => {
                initialComments.push({
                    commentId: c.commentId || ('c_' + Date.now() + '_' + Math.floor(Math.random() * 1000)), // ID가 누락되었을 경우 하위 호환 복구
                    name: state.userNickname, 
                    text: c.text, 
                    isMyComment: true
                });
            });

            return {
                id: index + 1,
                title: song["제목"],
                artist: song["가수"],
                category: song["카테고리"],
                tags: song["태그"],
                videoId: getYouTubeId(song["url"]),
                hearts: isLikedInCookie ? baseHearts + 1 : baseHearts,
                comments: initialComments,
                liked: isLikedInCookie
            };
        });

        // 2. 곡 제목(이름) 기준 오름차순 정렬 추가
        state.songs = mappedSongs.sort((a, b) => a.title.localeCompare(b.title, 'ko'));

        let tagSet = new Set();
        state.songs.forEach(s => s.tags.forEach(t => tagSet.add(t)));
        state.allTags = Array.from(tagSet);

        renderHome();
        initRecommendTags();

    } catch (error) {
        console.error('데이터 로딩 오류:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSongsData();
    initModalEvents();
    initRecommendEvents();
    initMyPageEvents();

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-link]');
        if (target) {
            const pageId = target.getAttribute('data-link');
            showPage(pageId);
        }
    });
});