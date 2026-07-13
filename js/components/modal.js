import { state, getMyCommentsFromCookie, saveMyCommentsToCookie, deleteCookie } from '../storage.js';
import { renderHome } from '../views/home.js';
import { renderMyPage } from '../views/mypage.js';

export function openModal(id) {
    state.currentSongId = id;
    const song = state.songs.find(s => s.id === id);
    if (!song) return;

    document.getElementById('modal-title').innerText = song.title;
    document.getElementById('modal-artist').innerText = song.artist;
    document.getElementById('player').src = `https://www.youtube.com/embed/${song.videoId}?autoplay=1`;
    document.getElementById('user-name').value = state.userNickname;

    const commentList = document.getElementById('comment-list');
    
    // 댓글 렌더링 시 내가 쓴 댓글(isMyComment가 true)인 경우 삭제 버튼을 띄웁니다.
    commentList.innerHTML = song.comments.map(c => `
        <div class="bg-gray-800 p-3 rounded flex justify-between items-start border border-gray-700/30">
            <div class="text-left flex-1 min-w-0 pr-2">
                <span class="text-xs text-sunset-orange font-bold">${c.name}</span>
                <p class="text-sm mt-1 text-gray-200 break-all">${c.text}</p>
            </div>
            ${c.isMyComment ? `
                <button data-comment-id="${c.commentId}" class="delete-comment-btn text-xs text-gray-500 hover:text-red-500 transition font-bold shrink-0 ml-2">
                    삭제
                </button>
            ` : ''}
        </div>
    `).join('') || '<p class="text-gray-500 text-sm py-4">첫 댓글을 남겨보세요!</p>';

    // 삭제 버튼 이벤트 바인딩
    commentList.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = e.target.dataset.commentId;
            deleteComment(commentId);
        });
    });

    document.getElementById('modal').classList.remove('hidden');
}

export function closeModal() { 
    document.getElementById('modal').classList.add('hidden'); 
    document.getElementById('player').src = ''; 
}

function addComment() { 
    const song = state.songs.find(s => s.id === state.currentSongId);
    const nameInput = document.getElementById('user-name');
    const commentInput = document.getElementById('user-comment');
    
    const inputName = nameInput.value.trim();
    let text = commentInput.value.trim();
    
    if(!text || !song) return;
    if(text.length > 10) text = text.substring(0, 10);

    const isMyComment = (inputName === state.userNickname || inputName === "");
    const name = inputName || state.userNickname;
    
    // 고유한 댓글 ID 생성을 위해 타임스탬프와 랜덤값을 조합합니다.
    const commentId = 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    song.comments.push({ commentId, name, text, isMyComment }); 

    if(isMyComment) {
        let storedComments = getMyCommentsFromCookie();
        storedComments.push({ commentId: commentId, songId: song.id, name: name, text: text });

        if (storedComments.length > 20) {
            let removed = storedComments.shift(); 
            const targetSong = state.songs.find(s => s.id === removed.songId);
            if(targetSong) {
                const targetIndex = targetSong.comments.findIndex(c => c.commentId === removed.commentId);
                if(targetIndex !== -1) targetSong.comments.splice(targetIndex, 1);
            }
        }
        saveMyCommentsToCookie(storedComments);
    }

    commentInput.value = '';
    openModal(song.id);
    renderHome(); 
    renderMyPage(); // 마이페이지 상태 실시간 갱신
}

// [새로 추가된 기능] 코멘트 직접 삭제 로직
function deleteComment(commentId) {
    if (!confirm("이 코멘트를 삭제하시겠습니까?")) return;

    // 1. 현재 메모리 상태(state.songs)에서 해당 댓글 즉시 제거
    const song = state.songs.find(s => s.id === state.currentSongId);
    if (song) {
        song.comments = song.comments.filter(c => c.commentId !== commentId);
    }

    // 2. 쿠키(user_comments) 데이터 로드 및 삭제 필터링
    let storedComments = getMyCommentsFromCookie();
    storedComments = storedComments.filter(c => c.commentId !== commentId);

    // 3. 남은 데이터 유무에 따른 동기화 처리 보강
    if (storedComments.length === 0) {
        deleteCookie("user_comments"); // 남은 댓글이 없으면 브라우저에서 파기
    } else {
        saveMyCommentsToCookie(storedComments); // 남아있다면 업데이트된 배열로 쿠키 오버라이트
    }

    // 4. UI 및 상태 실시간 반영
    openModal(state.currentSongId);
    renderHome();
    renderMyPage();
}

export function initModalEvents() {
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('add-comment-btn').addEventListener('click', addComment);
}