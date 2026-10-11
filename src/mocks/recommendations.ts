// UI 개발용 예시이며 실제 경로·계약가·추천 계산 결과가 아닙니다.
export const recommendations = [
  { id: 'hapjeong', name: '합정동', rank: 1, score: 92, lat: 37.5496, lng: 126.9139, x: 38, y: 40, work: 38, family: 46, transfers: 1, rent: 70, tags: ['한강 접근성', '맛집·카페'], description: '출퇴근과 다양한 생활 편의를 함께 살펴볼 동네', tone: 'green' },
  { id: 'sinchon', name: '신촌동', rank: 2, score: 86, lat: 37.5598, lng: 126.9423, x: 74, y: 27, work: 32, family: 48, transfers: 1, rent: 60, tags: ['대학가', '생활시설'], description: '활기찬 대학가와 편리한 교통이 있는 동네', tone: 'blue' },
  { id: 'mangwon', name: '망원동', rank: 3, score: 83, lat: 37.556, lng: 126.9015, x: 20, y: 56, work: 42, family: 52, transfers: 1, rent: 65, tags: ['한강 접근성', '동네 상권'], description: '시장과 공원 등 일상의 즐길 거리가 있는 동네', tone: 'sage' },
  { id: 'sangsu', name: '상수동', rank: 4, score: 80, lat: 37.5477, lng: 126.9227, x: 56, y: 54, work: 40, family: 50, transfers: 1, rent: 65, tags: ['홍대 인접', '맛집·카페'], description: '카페와 문화 공간을 가까이 즐길 수 있는 동네', tone: 'peach' },
  { id: 'dangsan', name: '당산동', rank: 5, score: 78, lat: 37.5349, lng: 126.9026, x: 31, y: 79, work: 18, family: 44, transfers: 0, rent: 75, tags: ['교통 편리', '한강 접근성'], description: '업무지구와 한강 주변 생활을 살펴볼 동네', tone: 'blue' },
]
export type Neighborhood = typeof recommendations[number]
