// js/storage.js 파일 수정 및 보완

export let state = {
    songs: [],
    allTags: [],
    selectedTags: [],
    currentSongId: null,
    userNickname: 'ㅇㅇ',
    isEditingNickname: false,
    currentScore: 0,
    quizTrack: [],
    currentRound: 0,
    correctCount: 0
};

// 쿠키 생성/수정 (SameSite 및 명시적 path 제공)
export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // 경로(path=/)를 명시적으로 입력하여 도메인 전체에서 일관되게 관리합니다.
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Strict";
}

export function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// [핵심 추가/수정] 쿠키 삭제 함수
// 반드시 생성할 때와 동일한 'path=/' 옵션을 지정해야 브라우저가 다른 쿠키로 오인하지 않고 정상 삭제합니다.
export function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
}

export function getLikedSongsFromCookie() {
    let cookieData = getCookie("liked_songs");
    if (cookieData) {
        try { return JSON.parse(cookieData); } catch(e) { return []; }
    }
    return [];
}

export function saveLikedSongsToCookie() {
    let likedTitles = state.songs.filter(s => s.liked).map(s => s.title);
    setCookie("liked_songs", JSON.stringify(likedTitles), 365);
}

export function getMyCommentsFromCookie() {
    let cookieData = getCookie("user_comments");
    if (cookieData) {
        try { return JSON.parse(cookieData); } catch(e) { return []; }
    }
    return [];
}

export function saveMyCommentsToCookie(myCommentsArray) {
    // 만약 저장할 댓글 배열이 비어있다면, 빈 값을 유지하는 대신 아예 쿠키를 지우도록 처리안전장치 추가
    if (!myCommentsArray || myCommentsArray.length === 0) {
        deleteCookie("user_comments");
    } else {
        setCookie("user_comments", JSON.stringify(myCommentsArray), 1);
    }
}

export function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}