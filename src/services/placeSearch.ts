import { loadKakaoMaps } from './kakaoMaps'
export type ResolvedPlace = { id: string; name: string; address: string; lat: number; lng: number }
export type SearchResult = { items: ResolvedPlace[]; total: number }
export async function searchPlaces(query: string): Promise<SearchResult> {
  if (!query.trim()) return { items: [], total: 0 }
  const sdk = await loadKakaoMaps()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('장소 검색 시간이 초과됐어요. 다시 시도해주세요.')), 12000)
    const finish = (result: SearchResult) => { clearTimeout(timer); resolve(result) }
    const fail = () => { clearTimeout(timer); reject(new Error('장소 검색에 실패했어요. 잠시 후 다시 시도해주세요.')) }
    try {
      new sdk.services.Places().keywordSearch(query.trim(), (items, status, pagination) => {
        if (status === sdk.services.Status.OK) {
          const valid = items.filter(p => p.x && p.y && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
          finish({ items: valid.map(p => ({ id: p.id, name: p.place_name, address: p.road_address_name || p.address_name, lat: Number(p.y), lng: Number(p.x) })), total: Number(pagination.totalCount) })
        } else if (status === sdk.services.Status.ZERO_RESULT) {
          // Residential addresses may have no POI; resolve them through the geocoder.
          new sdk.services.Geocoder().addressSearch(query.trim(), (addresses, addressStatus) => {
            if (addressStatus === sdk.services.Status.ZERO_RESULT) return finish({ items: [], total: 0 })
            if (addressStatus !== sdk.services.Status.OK) return fail()
            const valid = addresses.filter(p => p.x && p.y && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
            finish({ items: valid.map(p => ({ id: `address:${p.x}:${p.y}`, name: p.address_name, address: p.address_name, lat: Number(p.y), lng: Number(p.x) })), total: addresses.length })
          })
        } else fail()
      }, { size: 15 })
    } catch { fail() }
  })
}
