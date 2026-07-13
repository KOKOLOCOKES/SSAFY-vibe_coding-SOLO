// js/views/mypage.js 전체 수정본

import { state, setCookie, getMyCommentsFromCookie, saveMyCommentsToCookie, deleteCookie } from '../storage.js';
import { openModal } from '../components/modal.js';
import { renderRecentComments } from './home.js';

function toggleNicknameEdit() {
    const container = document.getElementById('nickname-container');
    const btn = document.getElementById('nickname-btn');
    if (!container || !btn) return;

    // 1. [수정 모드 진입] 현재 수정 중이 아닐 때 -> 인풋창으로 전환
    if (!state.isEditingNickname) {
        state.isEditingNickname = true;
        
        // 인풋창 생성
        container.innerHTML = `<input type="text" id="nickname-input" value="${state.userNickname}" maxlength="8" class="bg-gray-800 text-white px-2 py-0.5 rounded text-sm font-bold w-28 text-center focus:outline-none focus:ring-1 focus:ring-sunset-orange">`;
        
        // 버튼 스타일 및 텍스트 변경
        btn.innerText = "완료";
        btn.className = "bg-sunset-orange hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold transition text-white shadow";
        
        // 포커싱 및 엔터키 이벤트 바인딩
        const input = document.getElementById('nickname-input');
        if (input) {
            input.focus();
            // 키다운 이벤트 핸들러 분리하여 에러 방지
            input.onkeydown = function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    toggleNicknameEdit(); // 엔터 누르면 완료 함수 호출
                }
            };
        }
    } 
    // 2. [수정 완료 저장] 이미 수정 중일 때 -> 닉네임 저장 및 텍스트 전환
    else {
        const input = document.getElementById('nickname-input');
        if (!input) return;

        let newName = input.value.trim();
        
        if (newName === "") {
            alert("닉네임을 입력해주세요!");
            input.focus();
            return;
        }

        // 상태값 변경 및 쿠키 저장
        state.userNickname = newName;
        state.isEditingNickname = false;
        
        setCookie("user_nickname", state.userNickname, 365);
        
        // DOM 복구
        container.innerText = state.userNickname;
        btn.innerText = "수정";
        btn.className = "bg-gray-800 hover:bg-sunset-orange px-3 py-1 rounded text-xs font-bold transition text-white";
        
        // 내가 쓴 댓글들의 이름 실시간 동기화
        state.songs.forEach(s => {
            s.comments.forEach(c => {
                if (c.isMyComment) c.name = state.userNickname;
            });
        });

        let storedComments = getMyCommentsFromCookie();
        storedComments.forEach(c => c.name = state.userNickname);
        saveMyCommentsToCookie(storedComments);

        // 관련 뷰 전체 리렌더링
        renderMyPage();
        renderRecentComments();
    }
}

export function renderMyPage() {
    const commentContainer = document.getElementById('my-comments');
    if(!commentContainer) return;

    // 만약 현재 수정 모드 상태라면, 화면을 다시 그릴 때 인풋창 구조가 깨지지 않도록 방어 코드를 넣습니다.
    const container = document.getElementById('nickname-container');
    if (container && !state.isEditingNickname) {
        container.innerText = state.userNickname;
    }

    const myComments = [];
    state.songs.forEach(s => s.comments.forEach(c => { if(c.isMyComment) myComments.push({song: s, comment: c}) }));
    const sortedMyComments = [...myComments].reverse();

    commentContainer.innerHTML = sortedMyComments.length === 0 ? '<p class="text-gray-500 text-sm py-4">아직 코멘트를 달지 않았습니다.</p>' : sortedMyComments.map(c => `
        <div class="flex items-center justify-between bg-gray-800 p-4 rounded shadow-sm border border-gray-700/50">
            <div class="text-left min-w-0 flex-1 pr-2">
                <p class="font-bold text-sm truncate">${c.song.title}</p>
                <p class="text-xs text-gray-400 mt-1 break-all">${c.comment.text}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button data-id="${c.song.id}" class="mypage-move-btn bg-sunset-orange px-3 py-1 rounded text-xs font-bold shadow hover:bg-orange-600 transition">이동</button>
                <button data-comment-id="${c.comment.commentId}" data-song-id="${c.song.id}" class="mypage-delete-btn bg-gray-700 px-3 py-1 rounded text-xs font-bold text-gray-300 hover:bg-red-600 hover:text-white transition">삭제</button>
            </div>
        </div>
    `).join('');

    // 이동 버튼 이벤트
    commentContainer.querySelectorAll('.mypage-move-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.id)));
    });

    // 직접 삭제 버튼 이벤트
    commentContainer.querySelectorAll('.mypage-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = e.target.dataset.commentId;
            const songId = parseInt(e.target.dataset.songId);
            
            if (confirm("이 코멘트를 삭제하시겠습니까?")) {
                const song = state.songs.find(s => s.id === songId);
                if (song) song.comments = song.comments.filter(c => c.commentId !== commentId);

                let storedComments = getMyCommentsFromCookie();
                storedComments = storedComments.filter(c => c.commentId !== commentId);

                if (storedComments.length === 0) {
                    deleteCookie("user_comments");
                } else {
                    saveMyCommentsToCookie(storedComments);
                }

                renderMyPage();
                renderRecentComments();
            }
        });
    });

    // 좋아요 리스트 렌더링
    const likeContainer = document.getElementById('liked-songs-list');
    if (!likeContainer) return;
    const likedSongs = state.songs.filter(s => s.liked);
    
    likeContainer.innerHTML = likedSongs.length === 0 ? '<p class="text-gray-500 text-sm py-4">아직 좋아요를 누른 곡이 없습니다.</p>' : likedSongs.map(song => `
        <div class="flex items-center justify-between p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-md">
            <div class="text-left"><h4 class="font-bold">${song.title}</h4><p class="text-sm text-gray-400">${song.artist}</p></div>
            <button data-id="${song.id}" class="mypage-play-btn bg-gray-800 px-4 py-2 rounded text-sm font-bold hover:bg-sunset-orange transition">PLAY</button>
        </div>
    `).join('');

    likeContainer.querySelectorAll('.mypage-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.id)));
    });
}

// 초기 이벤트 설정 바인딩 (수정/완료 버튼 이벤트가 유실되지 않도록 보장)
export function initMyPageEvents() {
    const btn = document.getElementById('nickname-btn');
    if (btn) {
        // 기존의 중복 리스너 방지를 위해 한 번 초기화 후 재할당
        btn.onclick = null; 
        btn.addEventListener('click', toggleNicknameEdit);
    }
}