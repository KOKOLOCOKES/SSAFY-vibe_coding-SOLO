import { state } from '../storage.js';
import { openModal } from '../components/modal.js';

export function initRecommendTags() {
    const container = document.getElementById('tags-container');
    if(!container) return;
    container.innerHTML = state.allTags.map(tag => `
        <span draggable="true" id="tag-${tag}" data-tag="${tag}" class="recommend-tag bg-gray-800 px-4 py-2 rounded-full cursor-grab hover:bg-sunset-orange transition text-sm select-none font-bold">${tag}</span>
    `).join('');

    container.querySelectorAll('.recommend-tag').forEach(el => {
        el.addEventListener('dragstart', (ev) => ev.dataTransfer.setData("text", ev.target.dataset.tag));
    });
}

function clearSelectedTags() {
    state.selectedTags = [];
    document.getElementById('drop-zone').innerText = '태그를 이곳에 드래그하세요';
}

function findRecommendation() {
    if(state.selectedTags.length === 0) {
        alert("태그를 먼저 선택하세요!");
        return;
    }
    
    const matchedSongs = [...state.songs].sort((a,b) => {
        const countA = a.tags.filter(t => state.selectedTags.includes(t)).length;
        const countB = b.tags.filter(t => state.selectedTags.includes(t)).length;
        return countB - countA;
    });

    // 추천 곡 모달 오픈
    openModal(matchedSongs[0].id);
    clearSelectedTags();
}

function startQuizSession() {
    if(state.songs.length === 0) return;
    state.currentScore = 0;
    state.currentRound = 0;
    state.correctCount = 0;
    
    state.quizTrack = [...state.songs].sort(() => Math.random() - 0.5).slice(0, 10);
    
    document.getElementById('quiz-start-wrapper').classList.add('hidden');
    document.getElementById('quiz-options').classList.remove('hidden');
    
    nextQuizRound();
}

function nextQuizRound() {
    state.currentRound++;
    document.getElementById('quiz-round-display').innerText = `${state.currentRound} / 10`;
    document.getElementById('quiz-score-display').innerText = state.currentScore;
    
    const target = state.quizTrack[state.currentRound - 1];
    const player = document.getElementById('quiz-player');
    //player.classList.remove('hidden');
    player.src = `https://www.youtube.com/embed/${target.videoId}?autoplay=1&controls=0&disablekb=1`;
    
    const otherSongs = state.songs.filter(s => s.id !== target.id);
    const options = [target.title, ...otherSongs.slice(0, 3).map(s => s.title)].sort(() => Math.random() - 0.5);
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = options.map(title => `
        <button class="quiz-ans-btn bg-gray-800 py-3 rounded hover:bg-sunset-orange transition text-sm px-2 truncate font-bold shadow-sm" data-sel="${title}" data-target="${target.title}">
            ${title}
        </button>
    `).join('');

    optionsContainer.querySelectorAll('.quiz-ans-btn').forEach(btn => {
        btn.addEventListener('click', (e) => checkQuiz(e.target.dataset.sel, e.target.dataset.target));
    });
}

function checkQuiz(sel, target) {
    const quizArea = document.getElementById('quiz-area');
    const popup = document.getElementById('quiz-result-popup');
    const badge = document.getElementById('popup-status-badge');
    const msg = document.getElementById('popup-message');
    const scoreText = document.getElementById('popup-score-text');

    const isCorrect = (sel === target);

    // -------------------------------------------------------------
    // [새로 추가] 정답 / 오답 상황별 시각적 피드백 연출 (플래시 및 진동)
    // -------------------------------------------------------------
    if (isCorrect) {
        // 정답일 때: 퀴즈 영역 테두리에 초록색 링 빛이 파르르 도는 효과 (펄스)
        quizArea.classList.add('ring-4', 'ring-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.5)]', 'animate-pulse');
        
        // 다음 라운드 진입 시 효과 초기화를 위해 지워주는 타이머 처리
        setTimeout(() => {
            quizArea.classList.remove('ring-4', 'ring-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.5)]', 'animate-pulse');
        }, 1500);
    } else {
        // 오답일 때: 퀴즈 영역 전체가 붉게 변하며 좌우로 쾅쾅 격렬하게 진동
        quizArea.classList.add('ring-4', 'ring-red-600', 'shadow-[0_0_25px_rgba(220,38,38,0.6)]', 'animate-error-shake');
        
        // 애니메이션이 끝나면 진동 및 붉은 클래스 해제
        setTimeout(() => {
            quizArea.classList.remove('ring-4', 'ring-red-600', 'shadow-[0_0_25px_rgba(220,38,38,0.6)]', 'animate-error-shake');
        }, 400);
    }
    // -------------------------------------------------------------

    if (state.currentRound === 10) {
        if(isCorrect) {
            state.currentScore += 100;
            state.correctCount++;
        }
        badge.innerText = "🏆";
        msg.innerHTML = `퀴즈 종료!<br><span class="text-lg font-bold text-sunset-orange">총 ${state.correctCount}곡을 맞추셨습니다!</span>`;
        scoreText.innerHTML = `최종 Score: <span class="text-sunset-orange font-black">${state.currentScore}</span> 점`;
    } else {
        if(isCorrect) {
            badge.innerText = "🎉";
            msg.innerText = "GOOD! 정답입니다.";
            scoreText.innerHTML = `Score: <span class="text-sunset-orange font-black">${state.currentScore}</span> + 100`;
            state.currentScore += 100;
            state.correctCount++;
        } else {
            badge.innerText = "❌";
            msg.innerHTML = `오답입니다.<br><span class="text-sm font-normal text-gray-400">정답: ${target}</span>`;
            scoreText.innerHTML = `Score: <span class="text-sunset-orange font-black">${state.currentScore}</span> + 0`;
        }
    }

    document.getElementById('quiz-score-display').innerText = state.currentScore;

    // 이펙트 연출을 조금 더 몰입감 있게 본 뒤 결과창을 띄우고 싶다면 
    // 기존 바로 열리던 popup.classList.remove('hidden')을 약간의 지연시간(예: 0.3초) 후에 띄워주면 좋습니다.
    setTimeout(() => {
        popup.classList.remove('hidden');
    }, 500);

    //popup.classList.remove('hidden');
}

export function resetQuizSession() {
    // 1. 상태값 초기화
    state.currentScore = 0;
    state.currentRound = 0;
    state.correctCount = 0;
    state.quizTrack = [];

    // 2. UI 엘리먼트 존재 여부 확인 후 리셋 처리
    const startWrapper = document.getElementById('quiz-start-wrapper');
    const optionsContainer = document.getElementById('quiz-options');
    const player = document.getElementById('quiz-player');
    const roundDisplay = document.getElementById('quiz-round-display');
    const scoreDisplay = document.getElementById('quiz-score-display');
    const resultPopup = document.getElementById('quiz-result-popup');

    if (startWrapper) startWrapper.classList.remove('hidden'); // '퀴즈 시작하기' 버튼 다시 노출
    if (optionsContainer) {
        optionsContainer.classList.add('hidden');               // 4지선다 보기 숨김
        optionsContainer.innerHTML = '';
    }
    if (player) {
        player.src = '';                                       // 유튜브 오디오 재생 즉시 중단
    }
    if (roundDisplay) roundDisplay.innerText = "0 / 10";
    if (scoreDisplay) scoreDisplay.innerText = "0";
    
    // 혹시라도 결과 팝업이 켜져있었다면 완전히 숨김 (결과창 출력 안 함)
    if (resultPopup) resultPopup.classList.add('hidden');
}

function handleQuizPopupConfirm() {
    document.getElementById('quiz-result-popup').classList.add('hidden');
    if (state.currentRound < 10) {
        nextQuizRound();
    } else {
        // 10라운드가 모두 끝나서 정상 종료될 때도 리셋 함수를 재사용하여 깔끔하게 정리
        resetQuizSession();
    }
}

export function initRecommendEvents() {
    const dropZone = document.getElementById('drop-zone');
    const findBtn = document.getElementById('find-recommend-btn');

    // 드래그 앤 드롭 이벤트는 기존 유지
    dropZone.addEventListener('dragover', (ev) => ev.preventDefault());
    dropZone.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const tag = ev.dataTransfer.getData("text");
        if(!state.selectedTags.includes(tag) && tag) { 
            state.selectedTags.push(tag); 
            dropZone.innerText = state.selectedTags.join(', '); 
        }
    });

    document.getElementById('clear-tags-btn').addEventListener('click', clearSelectedTags);
    document.getElementById('start-quiz-btn').addEventListener('click', startQuizSession);
    document.getElementById('quiz-popup-confirm-btn').addEventListener('click', handleQuizPopupConfirm);

    // -------------------------------------------------------------
    // [새로 추가/변경] "노래 찾기!" 버튼 누르고 있기 & 뗄 때 뿅 나타나는 인터랙션
    // -------------------------------------------------------------
    
    // 변수 선언을 통해 마우스를 정상적으로 '누른 상태에서 뗐는지' 판별합니다.
    let isPressing = false;

    // 1. 버튼을 누르고 있을 때 (Hold) -> 흔들기 시작
    findBtn.addEventListener('mousedown', () => {
        if (state.selectedTags.length === 0) return; // 태그가 없으면 작동 안 함
        isPressing = true;
        
        // 점선 상자에 테두리 색상 강조와 함께 커스텀 흔들림 애니메이션 부여
        dropZone.classList.add('animate-fast-wiggle', 'border-sunset-orange');
    });

    // 2. 버튼에서 손을 뗄 때 (Release) -> 흔들기 멈추고 모달 오픈!
    findBtn.addEventListener('mouseup', () => {
        if (isPressing) {
            isPressing = false;
            
            // 흔들림 효과 제거
            dropZone.classList.remove('animate-fast-wiggle', 'border-sunset-orange');
            
            // 결과 도출 (모달창 뿅)
            findRecommendation();
        }
    });

    // 3. 버튼을 누른 채로 마우스가 버튼 영역 밖으로 나가버렸을 때 예외 처리 -> 흔들기 중단
    findBtn.addEventListener('mouseleave', () => {
        if (isPressing) {
            isPressing = false;
            dropZone.classList.remove('animate-fast-wiggle', 'border-sunset-orange');
        }
    });

    // 모바일 사용자를 위한 터치 이벤트 지원 (선택 사항)
    findBtn.addEventListener('touchstart', (e) => {
        if (state.selectedTags.length === 0) return;
        isPressing = true;
        dropZone.classList.add('animate-fast-wiggle', 'border-sunset-orange');
    });
    findBtn.addEventListener('touchend', (e) => {
        if (isPressing) {
            isPressing = false;
            dropZone.classList.remove('animate-fast-wiggle', 'border-sunset-orange');
            findRecommendation();
        }
    });
}