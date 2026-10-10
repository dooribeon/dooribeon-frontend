export interface MapPoint { getLat(): number; getLng(): number }
export interface MapInstance {
  panTo(point: MapPoint): void
  setCenter(point: MapPoint): void
  getCenter(): MapPoint
  relayout(): void
  setBounds(bounds: MapBounds): void
  addControl(control: object, position: number): void
}
interface MapBounds { extend(point: MapPoint): void }
export interface MapsSDK {
  load(callback: () => void): void
  LatLng: new (lat: number, lng: number) => MapPoint
  LatLngBounds: new () => MapBounds
  Map: new (container: HTMLElement, options: { center: MapPoint; level: number }) => MapInstance
  CustomOverlay: new (options: { map: MapInstance; position: MapPoint; content: HTMLElement; yAnchor: number; zIndex: number; clickable: boolean }) => { setMap(map: MapInstance | null): void }
  ZoomControl: new () => object
  ControlPosition: { RIGHT: number }
}
declare global { interface Window { kakao?: { maps: MapsSDK } } }
let loading: Promise<MapsSDK> | undefined

export function loadKakaoMaps(): Promise<MapsSDK> {
  if (loading) return loading
  const key = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
  if (!key) return Promise.reject(new Error('지도 키가 설정되지 않았어요. .env.local을 확인하고 개발 서버를 재시작해주세요.'))
  loading = new Promise<MapsSDK>((resolve, reject) => {
    const script = document.createElement('script')
    let settled = false
    const fail = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      script.remove()
      reject(new Error('지도를 불러오지 못했어요. 네트워크, JavaScript 키, 등록 도메인과 카카오맵 사용 설정을 확인해주세요.'))
    }
    const timer = window.setTimeout(fail, 15000)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.async = true
    script.onerror = fail
    script.onload = () => {
      if (!window.kakao?.maps) { fail(); return }
      window.kakao.maps.load(() => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(window.kakao!.maps)
      })
    }
    document.head.appendChild(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}
