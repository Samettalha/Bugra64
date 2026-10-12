import { useState, useEffect, useRef } from 'react'

/* =========================================================
   MÜZİK HOOK — Hicaz makamında "Buğra Ağıtı"
   ========================================================= */
function useTurkishAnthem() {
  const [playing, setPlaying] = useState(false)
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const intervalRef = useRef(null)

  const ensure = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
    }
    return ctxRef.current
  }

  const startLoop = () => {
    const ctx = ctxRef.current
    const master = masterRef.current

    const C4 = 261.63, Db4 = 277.18, E4 = 329.63, F4 = 349.23
    const G4 = 392.0, Ab4 = 415.3, B4 = 493.88, C5 = 523.25

    const melody = [
      E4, F4, G4, Ab4, B4, C5, B4, Ab4,
      G4, F4, E4, F4, G4, Ab4, G4, F4,
      E4, Db4, C4, Db4, E4, F4, G4, F4,
      E4, Db4, C4, Db4, E4, Db4, C4, C4,
    ]
    const bassLine = [
      C4 / 2, C4 / 2, G4 / 2, G4 / 2, Ab4 / 2, Ab4 / 2, G4 / 2, G4 / 2,
      F4 / 2, F4 / 2, E4 / 2, E4 / 2, F4 / 2, F4 / 2, E4 / 2, E4 / 2,
    ]

    const stepDur = 0.17

    const playNote = (freq, time, dur, type, vol) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, time)
      g.gain.exponentialRampToValueAtTime(vol, time + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
      osc.connect(g)
      g.connect(master)
      osc.start(time)
      osc.stop(time + dur + 0.05)
    }

    const kick = (time) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.frequency.setValueAtTime(160, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.09)
      g.gain.setValueAtTime(0.5, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.14)
      osc.connect(g)
      g.connect(master)
      osc.start(time)
      osc.stop(time + 0.2)
    }

    const hat = (time) => {
      const len = Math.floor(ctx.sampleRate * 0.05)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4)
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 6500
      const g = ctx.createGain()
      g.gain.value = 0.09
      src.connect(hp)
      hp.connect(g)
      g.connect(master)
      src.start(time)
    }

    let nextTime = ctx.currentTime + 0.1
    let step = 0

    const schedule = () => {
      while (nextTime < ctx.currentTime + 0.6) {
        const m = melody[step % melody.length]
        playNote(m, nextTime, stepDur * 0.85, 'square', 0.22)

        if (step % 2 === 0) {
          const b = bassLine[Math.floor(step / 2) % bassLine.length]
          playNote(b, nextTime, stepDur * 1.7, 'triangle', 0.32)
        }
        if (step % 4 === 0) kick(nextTime)
        if (step % 2 === 1) hat(nextTime)

        nextTime += stepDur
        step++
      }
    }

    schedule()
    intervalRef.current = setInterval(schedule, 120)
  }

  const toggle = () => {
    const ctx = ensure()
    if (ctx.state === 'suspended') ctx.resume()

    if (playing) {
      masterRef.current.gain.cancelScheduledValues(ctx.currentTime)
      masterRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)
      clearInterval(intervalRef.current)
      setPlaying(false)
    } else {
      masterRef.current.gain.cancelScheduledValues(ctx.currentTime)
      masterRef.current.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.35)
      startLoop()
      setPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close()
    }
  }, [])

  return { playing, toggle }
}

/* =========================================================
   TOPBAR
   ========================================================= */
function TopBar({ music }) {
  const [saat, setSaat] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setSaat(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-dot" />
        <span className="brand-text">
          BUGRA<span className="brand-accent">64</span>.TR
        </span>
      </div>

      <div className="topbar-right">
        <span className="live-badge">
          <span className="live-dot" /> CANLI
        </span>
        <span className="clock">{saat.toLocaleTimeString('tr-TR')}</span>
        <button className="music-btn" onClick={music.toggle}>
          {music.playing ? '🔊 AĞITI DURDUR' : '🎵 AĞITI ÇAL'}
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   TICKER
   ========================================================= */
const TICKER_ITEMS = [
  'SON DAKİKA: Buğra 64 aldı, borsa %64 düştü',
  'MİT: 64’ün arkasında dış güçler var',
  'NATO: "Buğra kardeşimiz yalnız değildir"',
  'Öğretmen: "Ben 65 verecektim, kalem elimden kaydı"',
  'BM Güvenlik Konseyi 64 sayfalık bildiri yayınladı',
  'Ekşi Sözlük’te 64 başlık açıldı',
  'NASA: "Uzaydan bakınca 64 net görünüyor"',
  '64 ülke ortak açıklama yaptı: "64 hepimizin"',
  'Prof. Dr.: "64 aslında bir sayı değil, bir duruş"',
  'MEB: "64 alan öğrencilerimize destek hattı kuruldu"',
  'Dolar 64 TL’yi gördü, Merkez Bankası sessiz',
  'Galatasaray: "Buğra’ya formamızı gönderiyoruz"',
  'Buğra’nın annesi: "Akşam yemeğe gelecek misin? Neyse 64’ü sonra konuşuruz"',
]

function NewsTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="ticker">
      <span className="ticker-label">SON DAKİKA</span>
      <div className="ticker-track">
        <div className="ticker-content">
          {items.map((t, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-sep">●</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   HERO
   ========================================================= */
function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">ULUSAL KRİZ · SEVİYE 64</div>
      <h1 className="hero-title">
        BUĞRA’NIN
        <span className="hero-num"> 64 </span>
        PUANI
      </h1>
      <p className="hero-sub">
        64 puan sadece bir sayı değil. Bu bir ruh. Bu bir duruş. Bu bir kardeşimiz.
      </p>
      <div className="hero-meta">
        <span>📅 1 sınav önce</span>
        <span>📍 Adı lazım değil lise</span>
        <span>🔥 Gündemde 64 saattir</span>
      </div>
    </section>
  )
}

/* =========================================================
   BUĞRA KARTI
   ========================================================= */
function BugraCard() {
  return (
    <section className="card bugra-card">
      <div className="bugra-avatar">
        <div className="avatar-circle">B</div>
        <div className="avatar-live">● AKTİF</div>
      </div>

      <div className="bugra-info">
        <h2>BUĞRA</h2>
        <p className="bugra-role">Kahramanımız · Efe Kazım Buğra Koçak</p>
      

        <div className="stat-grid">
          <div className="stat">
            <span className="stat-num">64</span>
            <span className="stat-label">PUAN</span>
          </div>
          <div className="stat">
            <span className="stat-num">1</span>
            <span className="stat-label">AĞLAYAN kİŞİ</span>
          </div>
          <div className="stat">
            <span className="stat-num">∞</span>
            <span className="stat-label">DESTEK</span>
          </div>
          <div className="stat">
            <span className="stat-num">0</span>
            <span className="stat-label">PİŞMANLIK</span>
          </div>
        </div>

        <p className="bugra-quote">
          “Ben 64 aldım ama sınıfın en iyi 64’üyüm.” <span>— Buğra</span>
        </p>
      </div>
    </section>
  )
}

/* =========================================================
   VİDEO GALERİSİ
   ========================================================= */
const VIDEOS = [
  {
    tip: 'youtube',
    id: '-BuVBCGXFfk',
    baslik: 'BUĞRA\'NIN SINAVA BAKTIĞI AN',
    aciklama: 'Buğra\'nın 64 puanı üzerine özel yayın. Ulusal basın canlı yayında.',
    sure: '10:00',
    tarih: 'Bu sabah',
  },
  {
    tip: 'youtube',
    id: 'uXCcV_TTG0o',
    baslik: 'BUĞRA\'NIN İLK AÇIKLAMASI',
    aciklama: 'Basın toplantısında Buğra: "Ben 64 aldım, siz 64 alabilir misiniz? Hayır."',
    sure: '04:22',
    tarih: '6 saat önce',
  },
  {
    tip: 'youtube',
    id: 'qIAKrF_PhuI',
    baslik: 'SINAVIN BUĞRA İÇİN YAPTIĞI BESTE(64)',
    aciklama: 'Ünlü sanatçı Buğra için bir ağıt besteledi. Hicaz makamında, 64 dakikalık eser.',
    sure: '03:35',
    tarih: '2 saat önce',
  },
]

function VideoCard({ video }) {
  const [oynat, setOynat] = useState(false)

  const ytThumb = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`
  const ytThumbFallback = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
  const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`

  return (
    <div className="video-card">
      <div className="video-frame">
        {oynat ? (
          <iframe
            src={embedUrl}
            title={video.baslik}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button className="video-thumb" onClick={() => setOynat(true)}>
            <img
              src={ytThumb}
              alt={video.baslik}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = ytThumbFallback
              }}
            />
            <div className="video-overlay">
              <div className="video-play">▶</div>
              <span className="video-duration">{video.sure}</span>
            </div>
          </button>
        )}
      </div>

      <div className="video-info">
        <span className="video-date">🔴 {video.tarih}</span>
        <h3>{video.baslik}</h3>
        <p>{video.aciklama}</p>
      </div>
    </div>
  )
}

function VideoGallery() {
  return (
    <section className="video-section">
      <h2 className="section-title">📺 SON DAKİKA VİDEOLARI</h2>
      <p className="section-sub">
        Ulusal yayın akışından seçmeler · Buğra'nın 64 puanı her yerde
      </p>
      <div className="video-grid">
        {VIDEOS.map((v, i) => (
          <VideoCard key={i} video={v} />
        ))}
      </div>
    </section>
  )
}

/* =========================================================
   MEME GALERİSİ
   ========================================================= */
const MEMES = [
  { top: 'SINAVDAN 64 ALDIM', emoji: '😎', bottom: 'ÖĞRETMEN: "BU ÇOCUK BİR DAHİ"', bg: 'linear-gradient(135deg, #fbbf24, #d97706)' },
  { top: 'ANNE: KAÇ ALDIN?', emoji: '🤔', bottom: 'BEN: 64 · ANNE: HE HE, AYNAYA BAKARAK SÖYLE', bg: 'linear-gradient(135deg, #ec4899, #7c3aed)' },
  { top: 'SINIF ARKADAŞLARIM 90 ALINCA', emoji: '💀', bottom: 'BEN 64 İLE GURUR DUYARKEN', bg: 'linear-gradient(135deg, #ef4444, #7f1d1d)' },
  { top: 'BABAM BENİM YAŞIMDAYKEN', emoji: '📚', bottom: 'OKUL YOKTU AMA YİNE 64 ALIRDI', bg: 'linear-gradient(135deg, #0ea5e9, #1e3a8a)' },
  { top: 'ÖĞRETMEN KAĞIDI VERİRKEN', emoji: '😊', bottom: '"HELAL OLSUN EVLADIM, GAYET İYİ"', bg: 'linear-gradient(135deg, #22c55e, #065f46)' },
  { top: '64 PUANLA ÜNİVERSİTEYE BAŞVURDUM', emoji: '🎓', bottom: 'YÖK: "KABUL, SEN FARKLI BİR ÇOCUKSUN"', bg: 'linear-gradient(135deg, #a855f7, #4c1d95)' },
  { top: 'İKİ TİP ÖĞRENCİ', emoji: '🤓 vs 😎', bottom: '100 ALAN vs 64 ALIP MUTLU OLAN', bg: 'linear-gradient(135deg, #f59e0b, #b45309)' },
  { top: 'SINAVDAN SONRA', emoji: '🎮🍕', bottom: '"64\'Ü HİÇ KAFAMA TAKMADIM" (3 SAATTİR AĞLIYORUM)', bg: 'linear-gradient(135deg, #6366f1, #312e81)' },
  { top: 'BEN 64 ALIRKEN', emoji: '🇹🇷', bottom: 'BİR ÜLKE KAHRAMANINI İZLEDİ', bg: 'linear-gradient(135deg, #dc2626, #7f1d1d)' },
  { top: 'MİT MÜSTEŞARI AÇIKLADI', emoji: '🕵️', bottom: '"64 PUANIN ARKASINDA DIŞ GÜÇLER VAR"', bg: 'linear-gradient(135deg, #14b8a6, #134e4a)' },
  { top: 'BUĞRA: "64 ALDIM"', emoji: '📱', bottom: 'WHATSAPP GRUP: 2.847 MESAJ', bg: 'linear-gradient(135deg, #25d366, #064e3b)' },
  { top: 'YIL 2045', emoji: '🤖', bottom: 'TORUNLARIMA ANLATIYORUM: "DEDENİZ 64 ALMIŞTI"', bg: 'linear-gradient(135deg, #f472b6, #9d174d)' },
]

function MemeCard({ meme, index }) {
  return (
    <div className="meme-card" style={{ background: meme.bg }}>
      <div className="meme-top">{meme.top}</div>
      <div className="meme-visual">
        <span className="meme-emoji">{meme.emoji}</span>
      </div>
      <div className="meme-bottom">{meme.bottom}</div>
      <div className="meme-footer">😂 BUGRA64.TR · MEME #{index + 1}</div>
    </div>
  )
}

function MemeGallery() {
  return (
    <section className="meme-section">
      <h2 className="section-title">😂 TÜRK MİZAH ARŞİVİ</h2>
      <p className="section-sub">
        Buğra'nın 64 puanı üzerine üretilmiş milli meme koleksiyonu · Ciddiyetle alınmalıdır
      </p>
      <div className="meme-grid">
        {MEMES.map((m, i) => (
          <MemeCard key={i} meme={m} index={i} />
        ))}
      </div>
    </section>
  )
}

/* =========================================================
   HABERLER
   ========================================================= */
const NEWS = [
  { kaynak: 'MİLLİ GAZETE', baslik: 'Buğra 64 aldı, piyasalar sarsıldı: Dolar 64 TL’ye dayandı', ozet: 'Ekonomistler “64 etkisi” konusunda uyardı. Merkez Bankası’ndan açıklama bekleniyor.' },
  { kaynak: 'GÜNDEM24', baslik: 'Öğretmen konuştu: “Ben 65 verecektim ama elim kaydı”', ozet: 'Sınav kağıdının fotokopisi sosyal medyada gündem oldu. 65 diyenlere tepki yağdı.' },
  { kaynak: 'SPOR ARENA', baslik: 'Süper Lig’den 64 puan hamlesi: “Buğra tribünde bizimle”', ozet: 'Bir kulüp, Buğra’ya sezonluk kombine hediye ettiğini duyurdu.' },
  { kaynak: 'TEKNOLOJİ HATTI', baslik: '64 GB telefonlar neden yeniden gündemde?', ozet: 'Uzmanlar “64 bir tesadüf değil” dedi. Cihaz satışları %64 arttı.' },
  { kaynak: 'DÜNYA BÜLTENİ', baslik: 'BM’den 64 sayfalık “Buğra” bildirisi', ozet: 'Bildiride “64 evrensel bir haktır, kimse 65 diyemez” ifadeleri yer aldı.' },
  { kaynak: 'BİLİM DERGİSİ', baslik: '64 = 8² · Matematikçiler sustu', ozet: 'Profesör: “Buğra farkında olmadan mükemmel kare sayı almış.”' },
]

function NewsGrid() {
  return (
    <section className="news-section">
      <h2 className="section-title">📰 BASINDA BUĞRA</h2>
      <div className="news-grid">
        {NEWS.map((n, i) => (
          <article key={i} className="news-card">
            <span className="news-source">{n.kaynak}</span>
            <h3>{n.baslik}</h3>
            <p>{n.ozet}</p>
            <span className="news-read">Devamını oku →</span>
          </article>
        ))}
      </div>
    </section>
  )
}

/* =========================================================
   WHATSAPP GRUP SOHBETİ
   ========================================================= */
const CHAT = [
  { from: 'deniz', text: 'kanka 64 ne lan 😭' },
  { from: 'bugra', text: 'kapat konuyu' },
  { from: 'aysu', text: 'BUĞRA 64 MÜ ALDIN' },
  { from: 'bugra', text: 'ya susun' },
  { from: 'samet', text: '64 puanla askere alıyorlar mı' },
  { from: 'bugra', text: 'gidiyom ben' },
  { from: 'erbey', text: 'gitme kanka yanındayız ❤️' },
  { from: 'furkan', text: '#BuğraYalnızDeğildir' },
  { from: 'erbey', text: 'ben 63 almıştım bak o da kötü' },
  { from: 'bugra', text: 'bu teselli mi şimdi' },
  { from: 'şevko', text: '64 = 8x8 kanka bak kare sayı' },
  { from: 'bugra', text: 'matematik öğretmeni misin sen' },
  { from: 'aysu', text: '2⁶ da oluyor aslında' },
  { from: 'bugra', text: 'İKİNİZ DE SUSUN' },
  { from: 'samet', text: 'Rakı içmeye geliyorum, kapıyı aç' },
  { from: 'bugra', text: 'açtım..' },
]

function ChatBox() {
  const [visible, setVisible] = useState(4)

  useEffect(() => {
    const t = setInterval(() => {
      setVisible((v) => (v >= CHAT.length ? v : v + 1))
    }, 1600)
    return () => clearInterval(t)
  }, [])

  const handleReplay = () => setVisible(1)

  return (
    <section className="chat-wrap">
      <div className="chat-phone">
        <div className="chat-header">
          <div className="chat-avatar">👥</div>
          <div>
            <div className="chat-title">12-B KAHRAMANLAR</div>
            <div className="chat-sub">
              {CHAT.length} katılımcı · Buğra yazıyor...
            </div>
          </div>
        </div>

        <div className="chat-body">
          {CHAT.slice(0, visible).map((m, i) => (
            <div
              key={i}
              className={`msg ${m.from === 'bugra' ? 'msg-out' : 'msg-in'}`}
            >
              <span className="msg-from">{m.from}</span>
              <span className="msg-text">{m.text}</span>
            </div>
          ))}
        </div>

        <div className="chat-footer">
          <button className="chat-replay" onClick={handleReplay}>
            ↩ BAŞTAN OYNAT
          </button>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   HÜKÜMET AÇIKLAMALARI
   ========================================================= */
const OFFICIAL = [
  { kurum: 'BAKANLAR KURULU', aciklama: '4 saatlik toplantı sonrası: “64 puan milli bir meseledir. Gerekli adımlar atılacaktır.”' },
  { kurum: 'MEB', aciklama: '“64 alan öğrencilerimizin yanındayız. Notlar pedagojik gerekçelerle yeniden değerlendirilecek.”' },
  { kurum: 'SAĞLIK BAKANLIĞI', aciklama: '“64 alanlar için 7/24 psikolojik destek hattı: 0 64 64 64. Arayın, yalnız değilsiniz.”' },
  { kurum: 'DIŞİŞLERİ', aciklama: '“64’ü tanıyoruz. 65 diyen ülkelerle ilişkilerimiz gözden geçirilecek.”' },
  { kurum: 'MERKEZ BANKASI', aciklama: '“64 puan için özel teşvik paketi hazır. Faiz değil, moral indirimi.”' },
]

function GovernmentPanel() {
  return (
    <section className="gov-section">
      <h2 className="section-title">🏛️ RESMİ AÇIKLAMALAR</h2>
      <div className="gov-grid">
        {OFFICIAL.map((o, i) => (
          <div key={i} className="gov-card">
            <div className="gov-kurum">{o.kurum}</div>
            <p>{o.aciklama}</p>
            <div className="gov-stamp">64 · RESMİ</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* =========================================================
   TRENDLER
   ========================================================= */
const TRENDS = [
  { tag: '#Buğra64Puan', count: '2,4 Mn' },
  { tag: '#64YalnızDeğildir', count: '1,8 Mn' },
  { tag: '#BuğraİçinAdalet', count: '1,1 Mn' },
  { tag: '#65Değil64', count: '940 B' },
  { tag: '#64BirSayıDeğilDuruştur', count: '612 B' },
  { tag: '#Bizde64Aldık', count: '503 B' },
  { tag: '#Sınavdaki64', count: '214 B' },
  { tag: '#BuğraKardeşimizinYanındayız', count: '98 B' },
]

function Trends() {
  return (
    <section className="trends-section">
      <h2 className="section-title">🔥 SOSYAL MEDYA GÜNDEMİ</h2>
      <div className="trends-list">
        {TRENDS.map((t, i) => (
          <div key={i} className="trend-row">
            <span className="trend-no">{i + 1}</span>
            <span className="trend-tag">{t.tag}</span>
            <span className="trend-count">{t.count} paylaşım</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* =========================================================
   MİNİ OYUN
   ========================================================= */
const SAVUNMALAR = [
  '“64 aslında 65’e yuvarlanır kanka”',
  '“Sınavda 64 kişi vardı, tesadüf mü?”',
  '“Ben 64 aldım ama sınıfın en iyi 64’üyüm”',
  '“Kağıtta 64 yazıyor ama kalbimde 100”',
  '“Öğretmen puanlarken eli titriyordu”',
  '“64 = 8², matematiksel olarak mükemmel”',
  '“64 GB iPhone bile var, ne var yani”',
  '“Minecraft’ta 64’lük stack kutsaldır”',
  '“64 il vardı bu ülkede, saygı duy”',
  '“64-bit işlemci dünyayı değiştirdi”',
  '“Nobel komitesi bu puanı inceliyor”',
  '“Tek eksik 36, o da gelir”',
]

function PuanOyunu() {
  const [puan, setPuan] = useState(64)
  const [msgs, setMsgs] = useState(['Başlangıç: 64. Kaderimiz.'])
  const [shake, setShake] = useState(false)
  const [savunma, setSavunma] = useState('“Savunmaya ihtiyacım yok, ben haklıyım.”')

  const esikler = {
    65: '😳 BİR PUAN GELDİ! HEMEN BASINA BİLDİRİN!',
    66: '📈 Borsa yeşile döndü kanka',
    70: '🔥 70! Buğra artık geçer not sınırında',
    75: '🚀 UZAYA ÇIKIYORUZ',
    80: '👑 BUĞRA KRAL',
    85: '🏆 Nobel komitesi aradı',
    90: '🌟 EFSANE',
    95: '💎 ELMAS LİG',
    100: '🎉 100! ...Ama kanka sınavda yoktun işte',
  }

  const ekle = () => {
    setPuan((p) => {
      const yeni = p + 1
      if (esikler[yeni]) {
        setMsgs((m) => [esikler[yeni], ...m].slice(0, 5))
      } else if (yeni > 100 && yeni % 10 === 0) {
        setMsgs((m) =>
          [`${yeni} puan! Artık bu bir sorun haline geliyor...`, ...m].slice(0, 5)
        )
      }
      return yeni
    })
    setShake(true)
    setTimeout(() => setShake(false), 200)
  }

  const sifirla = () => {
    setPuan(64)
    setMsgs(['Başlangıç: 64. Kaderimiz.'])
    setSavunma('“Savunmaya ihtiyacım yok, ben haklıyım.”')
  }

  const savun = () => {
    const r = SAVUNMALAR[Math.floor(Math.random() * SAVUNMALAR.length)]
    setSavunma(r)
  }

  return (
    <section className="game-section">
      <h2 className="section-title">🎮 64 PUANI KURTAR</h2>

      <div className="game-panel">
        <div className={`game-counter ${shake ? 'shake' : ''}`}>{puan}</div>

        <div className="game-buttons">
          <button className="btn btn-primary" onClick={ekle}>
            +1 PUAN VER
          </button>
          <button className="btn btn-ghost" onClick={savun}>
            🛡️ SAVUNMA ÜRET
          </button>
          <button className="btn btn-danger" onClick={sifirla}>
            ♻ SIFIRLA (64)
          </button>
        </div>

        <div className="savunma-box">
          <span className="savunma-label">BUGRA’NIN SAVUNMASI:</span>
          <p>{savunma}</p>
        </div>

        <div className="game-log">
          {msgs.map((m, i) => (
            <div key={i} className="log-line">
              {m}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   FOOTER
   ========================================================= */
function Footer() {
  return (
    <footer className="footer">
      <p>
        <strong>UYARI:</strong> Bu site tamamen bir arkadaş grubu şakasıdır.
        Buğra bizim kardeşimizdir. 64 puan sadece bir sayıdır. Gerçekten.
      </p>
      <p className="footer-sub">
        © 2025 Buğra64.tr · Tüm hakları 64’e aittir · Made with ❤️ ve Hicaz makamı
      </p>
    </footer>
  )
}

/* =========================================================
   APP
   ========================================================= */
export default function App() {
  const music = useTurkishAnthem()

  return (
    <div className="app">
      <TopBar music={music} />
      <NewsTicker />
      <main className="main">
        <Hero />
        <BugraCard />
        <VideoGallery />
        <MemeGallery />
        <NewsGrid />
        <ChatBox />
        <GovernmentPanel />
        <Trends />
        <PuanOyunu />
      </main>
      <Footer />
    </div>
  )
}