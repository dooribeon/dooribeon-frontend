// 서버가 장소별로 보내는 같은 안내만 묶고, 오류와 그 밖의 안내는 그대로 보여준다.
export function conversationNotices(notices: string[]): string[] {
  const defaults = new Set<string>()
  const unclearVisits = new Set<string>()
  const other: string[] = []
  const frequencySuffix = '의 방문 횟수는 확실하지 않아 반영하지 않았어요. 원하시면 주·월 횟수를 입력할 수 있어요.'

  for (const notice of notices) {
    if (notice.endsWith("은(는) 서비스 기본값에 따라 중요도를 '필수'로 설정했어요. 원하시면 중요도를 바꿀 수 있어요.")
        || notice === '회사·학교 장소는 서비스 기본값으로 중요도를 필수로 설정했어요. 원하시면 바꿀 수 있어요.') {
      defaults.add('회사·학교의 기본 중요도는 ‘필수’예요.')
    } else if (notice.endsWith('의 이동수단은 계산할 때 대중교통을 기본으로 적용해요.')) {
      defaults.add('선택 장소의 이동수단을 비워 두면 대중교통으로 계산해요.')
    } else if (notice.endsWith(frequencySuffix)) {
      unclearVisits.add(notice.slice(0, -frequencySuffix.length))
    } else {
      other.push(notice)
    }
  }
  const summary = []
  if (defaults.size) summary.push([...defaults].join(' '))
  if (unclearVisits.size) summary.push([...unclearVisits].join('·') + ' 방문 횟수는 미설정이에요.')
  return [...summary, ...other]
}
