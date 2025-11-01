# ⚽ Futbol Match Engine - Modüler Yapı

## 📁 Proje Yapısı

```
src/
├── matchEngine.ts          # Ana motor (613 satır → basitleştirildi)
├── canvasTypes.ts          # Tip tanımlamaları
├── web.ts                  # Web arayüzü
└── engine/                 # Modüler sistemler
    ├── PlayerBehavior.ts     # Oyuncu tipleri ve özellikleri
    ├── BallPhysics.ts        # Top fiziği ve gol kontrolü
    ├── PlayerActions.ts      # Pas, şut, dribbling aksiyonları
    ├── TacticalAI.ts         # Taktiksel organizasyon
    ├── PlayerMovement.ts     # Oyuncu hareketi ve çarpışma kontrolü
    └── PossessionControl.ts  # Top kontrolü ve karar verme
```

## 🎯 Modüller

### 1. **PlayerBehavior** (Oyuncu Davranışları)
- **Görev**: Oyuncu tipi ataması ve özellik yönetimi
- **13 Farklı Oyuncu Tipi**:
  - **Kaleciler**: Sweeper-Keeper, Traditional-GK
  - **Defans**: Ball-Playing-Def, Stopper, Covering-Def
  - **Orta Saha**: Box-to-Box, Playmaker, Defensive-Mid, Attacking-Mid
  - **Forvet**: Target-Man, Poacher, False-Nine, Winger
- **Özellikler**: speed, skill, passing, shooting, positioning, workRate

### 2. **BallPhysics** (Top Fiziği)
- **Görev**: Top hareketi ve fizik simülasyonu
- **Özellikler**:
  - Gerçekçi sürtünme (0.94 çim faktörü)
  - Saha sınırı sekmeleri (0.6 azalma)
  - Maksimum hız limiti (18 birim)
  - Gol kontrolü (hız ve yön analizi)
  - Taç/köşe/kale vuruşu algılama

### 3. **PlayerActions** (Oyuncu Aksiyonları)
- **Görev**: Pas, şut ve dribbling mekanikleri
- **Pas Sistemi**:
  - Akıllı hedef seçimi (pozisyon, mesafe, baskı analizi)
  - Rakip geçiş yolu kontrolü
  - İleri pas bonusları
- **Şut Sistemi**:
  - Mesafe bazlı isabetlilik
  - Baskı etkisi
  - Kale açısı hesaplama
- **Kaleci Özel**: clearBall() ile uzun top atışları

### 4. **TacticalAI** (Taktiksel Zeka)
- **Görev**: Takım organizasyonu ve taktik
- **Hücum Organizasyonu**:
  - Oyuncu tipine göre pozisyon alma
  - İleriye doğru hareket (ball-playing-def +100px)
  - Kanat oyuncuları geniş durur
  - Playmaker'lar merkez kontrolü
- **Savunma Organizasyonu**:
  - Kompakt yapı
  - Baskı mesafe kontrolü (120px)
  - Kalp arkası koruma

### 5. **PlayerMovement** (Oyuncu Hareketi)
- **Görev**: Hareket ve çarpışma önleme
- **Çarpışma Önleme**:
  - Multi-vektör sistem
  - 50px algılama yarıçapı
  - Dinamik hız ayarlaması (0.6x yakınlarda)
- **Akıllı Hareket**:
  - Topa doğru 70% + kaçış 30%
  - Saha sınır kontrolleri
  - Anti-locking mekanizmaları

### 6. **PossessionControl** (Top Kontrolü)
- **Görev**: Top sahipliği ve karar verme
- **Akıllı Kontrol**:
  - Skill-bazlı top kapma
  - Kaleci özel mantık (150px kısıtlama)
  - Pozisyon bazlı kovalama kararları
- **Anti-Locking**:
  - 200px GK kısıtlaması
  - 80px otomatik şut
  - 50px yan kaçış

## 🔧 Kullanım

```typescript
// Modüller otomatik olarak başlatılır
const engine = new MatchEngine('gameCanvas');

// Engine artık modüler sistemleri kullanır
// - playerBehavior: Oyuncu tipi ve özellikler
// - ballPhysics: Top fiziği
// - playerActions: Pas/şut/dribbling
// - tacticalAI: Taktiksel organizasyon
// - playerMovement: Hareket ve çarpışma
// - possessionControl: Top kontrolü

engine.setTeamNames('Galatasaray', 'Fenerbahçe');
engine.startMatch();
```

## 💡 Avantajlar

### 1. **Okunabilirlik**
- Her modül tek bir sorumluluğa sahip
- Kod mantığı açık ve anlaşılır
- Dokümantasyon kolaylaştı

### 2. **Bakım Kolaylığı**
- Hata ayıklama daha kolay
- Değişiklikler izole edilmiş
- Test edilebilirlik arttı

### 3. **Genişletilebilirlik**
- Yeni oyuncu tipleri eklemek kolay
- Taktik sistemleri bağımsız geliştirilebilir
- Fizik motoru ayrı optimize edilebilir

### 4. **Performans**
- Her modül kendi optimizasyonuna sahip
- Gereksiz bağımlılıklar yok
- Kodun %68'i modüllere taşındı (1300+ satır)

## 📊 Metrikler

- **Ana Dosya**: 1911 → 613 satır (%68 azalma)
- **Modül Sayısı**: 6 adet
- **Ortalama Modül Boyutu**: ~200 satır
- **Toplam Oyuncu Tipi**: 13 adet
- **Taktiksel Sistem**: 2 adet (hücum/savunma)

## 🚀 Geliştirme

Yeni özellik eklerken:

1. Doğru modülü belirle
2. Modülde değişiklik yap
3. matchEngine.ts'de modülü kullan
4. Test et

Örnek:
```typescript
// PlayerActions.ts'ye yeni aksiyon ekle
public attemptLobPass(player: Player2D, ...) { ... }

// matchEngine.ts'de kullan
this.playerActions.attemptLobPass(player, ...);
```

## 🎮 Oyuncu Tip Sistemi

Her oyuncu tipi özel davranışlara sahip:

```typescript
// Playmaker - %75 pas, %15 şut
// Poacher - %20 pas, %65 şut
// Winger - %25 pas, %35 şut, %65 dribbling
```

## ⚙️ Yapılandırma

Modüller fieldWidth ve fieldHeight ile başlatılır:
```typescript
new PlayerBehavior(1000, 600)
new BallPhysics(1000, 600)
// ...
```

## 📝 Notlar

- Tüm AI mekanikleri yerinde kaldı
- 13 oyuncu tipi sistemi aktif
- Taktiksel organizasyon çalışıyor
- Kaleci özel davranışları korundu
- Anti-locking mekanizmaları aktif

## 🔄 Güncelleme Geçmişi

### v2.0.0 - Modüler Yapı
- ✅ 6 modüle ayrıldı
- ✅ %68 kod azaltımı
- ✅ Tüm özellikler korundu
- ✅ Performans iyileştirildi

### v1.0.0 - İlk Sürüm
- 13 oyuncu tipi sistemi
- Taktiksel AI
- Anti-locking mekanizmaları
