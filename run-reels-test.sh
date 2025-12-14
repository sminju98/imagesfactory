#!/bin/bash

# Reels Factory 테스트 실행 스크립트

echo "🎬 Reels Factory 테스트 실행"
echo "================================"
echo ""

# 개발 서버 확인
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  개발 서버가 실행 중이지 않습니다."
    echo "다른 터미널에서 'pnpm dev'를 실행하세요."
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 인증 토큰 확인
if [ -z "$TEST_AUTH_TOKEN" ]; then
    echo "❌ TEST_AUTH_TOKEN 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "인증 토큰을 가져오는 방법:"
    echo "1. 브라우저에서 이미지팩토리에 로그인"
    echo "2. 개발자 도구 (F12) 열기"
    echo "3. 콘솔에서 다음 명령 실행:"
    echo "   firebase.auth().currentUser.getIdToken().then(console.log)"
    echo ""
    read -p "인증 토큰을 입력하세요: " TOKEN
    export TEST_AUTH_TOKEN="$TOKEN"
fi

# 테스트 실행
echo ""
echo "🚀 테스트 시작..."
echo ""

node test-reels-api.js

echo ""
echo "✅ 테스트 완료!"
echo ""
echo "결과 파일 위치: reels-test-output/"
echo "HTML 리포트: reels-test-output/index.html"
echo ""


