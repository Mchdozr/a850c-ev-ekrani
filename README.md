# A 850 C · Ev ekranı

Arçelik A 850 C için Next.js tasarımcı ve sideload edilen Android TV HOME uygulaması. Android paket adı `dev.evekrani.a850c`, uygulama adı **Ev ekranı**.

Sistem başlatıcıları (`com.google.android.apps.tv.launcherx`, `com.google.android.tvlauncher`), firmware, üreticinin açılış logosu, sistem bölümü ve imza kontrolü değiştirilmez. Bu, Android açıldıktan sonra varsayılan Ana Sayfa olarak seçilen bağımsız uygulamadır.

## Önce kendi tarayıcınızda görün

Kurulumsuz görünüm: `release/Ev-Ekrani-Onizleme.zip` dosyasını indirin, ZIP'i çıkarın ve içindeki **Onizleme.html** dosyasına çift tıklayın. İnternet, Node.js ve sunucu gerekmez; sekiz duvar görseli ve fontlar dosyanın içindedir. Tasarımcı ve TV ekranı projedeki gerçek bileşenlerdir: tema, görünüm ayarları, fotoğraf yükleme ve JSON dışa aktarma kullanılabilir. Telefon bağlantısı ve REA sunucu gerektirir; dosya önizlemesi bunlara bağlıymış gibi görünmez. Dosyanın güncel sürümü `npm run preview:build` ile üretilir.

Tam uygulama: GitHub'dan projeyi ZIP olarak indirip çıkarın. Windows'ta **Baslat.cmd**, macOS'ta **Baslat.command** açılır; Linux'ta `bash Baslat.command` kullanılır. Node.js LTS gerekir; yoksa Windows başlatıcı kurulumsuz önizlemeyi açar ve Node.js kurulum bilgisini gösterir. Başlatıcı eksik npm bağımlılıklarını kurar, üretim derlemesini alır, boş port seçer ve uygulama yanıt verdiğinde tarayıcıyı açar. Terminal açık kaldığı sürece çalışır. Projeyi güncellerken kilit dosyası değiştiyse `npm ci` çalıştırın.

Sohbetteki bulut makinesinin `127.0.0.1` adresi sizin bilgisayarınıza ait değildir. Yukarıdaki başlatıcıyı kendi bilgisayarınızda çalıştırınca açılan adres sizin tarayıcınızda erişilebilir olur. Kalıcı internet adresi için ayrıca erişilebilir bir Node.js barındırma hesabı gerekir; bu depo kendiliğinden yayınlanmış bir web sitesi değildir.

## Görünüm

Varsayılan: İstanbul akşamı, sol üstte İstanbul saati/tarihi, YouTube solda ve Netflix sağda eşit yükseklikte büyük karolar; ikinci sırada Disney+, BluTV, tabii ve Ayarlar. Beyaz odak çerçevesi yön tuşlarıyla hareket eder.

- **Mozaik:** iki büyük öncelikli karo ve altında diğer uygulamalar.
- **Dock:** altta tek sıra; YouTube ve Netflix daha büyük. JSON içindeki eski `salon` kimliği uyumluluk için korunur.
- **Sinema:** büyük içerik afişi, yan liste ve uygulama sütunu; bunlar örnek içeriklerdir, yayın servislerinden izleme geçmişi alınmaz.
- **Saat:** 160 px saat; uygulamalar bir yön tuşuna veya telefonun yön komutuna kadar gizlidir.

Kendin yap panelinde dört düzen, sekiz arka plan, Marka renkleri/Sade cam karolar, Logo ve ad/Yalnız logo/Yalnız ad, logo rengi, Modern/Yumuşak font, saat, lamba yoğunluğu ve uygulama seçimi bulunur. Fotoğraf yükleme ve lamba ana panelden erişilir. Değişiklikler hemen uygulanır. **Boğaz Camı, Amber Salon, Gece Mavisi, Kış Sessizliği** temaları uygulama listenizi, içeriklerinizi ve seçili düzeninizi korur.

YouTube kırmızı zeminde beyaz oynat işareti, Netflix koyu zeminde beyaz vektör N kullanır; Disney+ yaylı tam adı, BluTV ve tabii tam kelime işaretleriyle çizilir. Resmî marka logo paketi indirilmez; düşük çözünürlüklü sabit PNG plakalarına bağımlılık yoktur. Android'de kurulu uygulamanın ikonu kullanılır; paket bulunamazsa aynı çizilmiş işaret gösterilir. Sade ve tek renk seçenekleri çizilmiş işareti kullanarak sabit plaka sorununu önler.

Modern = **Inter**, Yumuşak = **Nunito Sans**; font dosyaları ve OFL lisansları web/Android paketinde bulunur. Tasarım 1920×1080 referanslıdır ve 4K'da orantılı çizilir.

Sekiz arka plan da yerel JPEG sahnesidir: `istanbul-aksam`, `sonbahar-bahce`, `siyah` (obsidyen kıvrımlar), `bakir-lamba`, `gece-cam`, `somine`, `zeytin-gece`, `kis-aksami`. Son altısı artık siyaha yakın, birbirine benzeyen geçişler değildir. Web ve APK aynı JPEG dosyalarını, hafif okunaklılık gölgesini ve lamba ışığını kullanır; Sade karolar ve panel arka planı bulanık camdır.

**Görsel kaynağı:** önceki iki JPG, logolar, fontlar ve APK `11dd216` commit'ine yüklenmemişti; bu klonda korunabilecek eski ikili dosyalar yoktu. Eksik duvarlar aynı dosya adlarıyla yeni üretilmiş fotoğraf tarzı sahnelerle tamamlandı; orijinal fotoğrafların kurtarıldığı iddia edilmez. Kaynaklar, lisanslar ve doğrulama özetleri `assets/SOURCES.md` ve `assets/asset-manifest.json` içindedir.

## Web tasarımcıyı çalıştırma

Node.js 20.9+ gerekir; bu ortamda Node.js 24 ile doğrulanır.

```bash
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Tasarımcı `/`, tam ekran önizleme `/tv`, tarayıcı kumandası `/kumanda` yolundadır. Telefonla erişim için bilgisayarın yerel ağ adresini kullanın; telefonunuzun `localhost` adresi bilgisayarınız değildir. Sunucu ve telefon aynı ağda olmalıdır.

Web tasarımı yalnızca bu tarayıcının `localStorage` alanında **`a850c-ev-ekrani-v3`** anahtarıyla tutulur. Telefonda aynı JSON otomatik oluşmaz; Android uygulaması da bu depoyu okumaz. **Dosya ve REA → Dosya** bölümünden JSON dışa aktarılır/geri yüklenir. Geçersiz JSON mevcut tasarımı değiştirmez.

## Akşam kurulumu: tasarımcıdan fiziksel TV'ye

1. Tasarımcıda görünümü hazırlayın ve **Dosya ve REA → Dosya → JSON indir** ile `a850c-ev-ekrani.json` alın.
2. TV'de geliştirici seçeneklerini ve hata ayıklamayı açın; USB veya TV'nin gösterdiği kablosuz eşleştirme adresiyle ADB bağlantısını kurun.
3. JSON'u aktarın ve APK'yı kurun:

```bash
adb devices
adb push a850c-ev-ekrani.json /sdcard/Download/a850c-ev-ekrani.json
adb install -r android/evekrani-a850c-debug.apk
adb shell pm grant dev.evekrani.a850c android.permission.READ_EXTERNAL_STORAGE
```

İsterseniz bu aktarım ve kurulumu tek komutla yapın; ikinci argüman isteğe bağlı ADB cihaz seri numarasıdır:

```bash
bash scripts/deploy-tv.sh ~/Downloads/a850c-ev-ekrani.json
bash scripts/deploy-tv.sh ~/Downloads/a850c-ev-ekrani.json 192.168.1.50:5555
```

4. Kumandada Ana Sayfa'ya basıp **Ev ekranı** uygulamasını varsayılan seçin; seçim açılmazsa TV ayarlarının varsayılan ana sayfa bölümünü kullanın. Sistem başlatıcısını kaldırmayın veya devre dışı bırakmayın.
5. Yeni JSON aktarınca Ana Sayfa'ya tekrar basın; dosya yeniden okunur. Gerekirse yalnızca bu uygulamayı yeniden başlatın: `adb shell am force-stop dev.evekrani.a850c`, ardından Ana Sayfa.

APK, `/sdcard/Download/a850c-ev-ekrani.json` dosyasını isteğe bağlı okur; dosya yoksa İstanbul varsayılanı açılır, bozuk dosyada uyarı ve varsayılan görünüm kullanılır. TV panelindeki değişiklikler uygulamanın özel alanında saklanır; dışarıdan farklı bir JSON aktarılması yeni tasarımı yükler. Özel fotoğraf JSON'a gömülüdür.

`INSTALL_FAILED_UPDATE_INCOMPATIBLE`, önceki APK'nın farklı bir debug anahtarıyla imzalandığını gösterir; `-r` imza kontrolünü aşmaz. Aynı anahtarla yeniden derleyin veya verileri yedekledikten sonra eski uygulamayı kaldırıp yeniden kurmayı kendiniz seçin; betik otomatik kaldırma yapmaz. Bu depoda imza anahtarı paylaşılmaz.

## QR ile telefon kumandası — gerçek APK

1. TV ve telefonu aynı Wi-Fi/LAN'a bağlayın.
2. Ev ekranında kumandanın **Menü** tuşuna basın veya **Ayarlar → Telefonla bağlan** seçin.
3. TV'nin gösterdiği QR kodunu telefon kamerasıyla okutun; tarayıcı doğrudan TV'nin sunduğu kumandayı açar.

Telefon kumandasında YouTube/Netflix kısayolları, yukarı/sol/Tamam/sağ/aşağı, Geri ve Ev ekranı bulunur. **Bilgisayar, Next.js, hesap veya internet gerekmez.** Bağlantı kalp atışıyla izlenir; durum satırı yalnızca yanıt varken Bağlı olur.

Bu kumanda Ev ekranında gezinir ve kurulu uygulamaları başlatır; açılan Netflix/YouTube gibi başka uygulamaların içindeki tuşları yönetmez. Başka uygulama açıkken yön komutları açıklamayla reddedilir. Android'in arka plan sınırlamaları veya süreci kapatması durumunda fiziksel Ana Sayfa tuşuyla dönüp QR'ı yeniden okutun. Ses/güç ve sistem geneli kumanda yetkisi eklenmez.

Yerel sunucu IPv4 Wi-Fi/Ethernet adresini ve rastgele portu kullanır; bağlantı URL'si her uygulama sürecinde yeni, 192 bit rastgele anahtar taşır. Sunucu uygulama yok edilirken kapanır; sekiz saniye yanıt vermeyen telefon bağlantısı düşer. Misafir ağı/istemci yalıtımı cihazların birbirine erişmesini engelleyebilir. URL'yi erişim izni vermek istediğiniz kişilerle paylaşın.

## Tarayıcı QR kumandası — ayrı önizleme

Tasarımcıdaki veya `/tv` sayfasındaki **Telefonla bağlan**, `/tv` önizlemesi için QR üretir. Sunucu adresi telefonun erişebildiği adres olmalıdır; loopback adresinden QR üretilmez. Ayrı ekranlar rastgele oturumlarla ayrılır. Kumanda kısayolları önizleme odağını seçer; tarayıcı fiziksel TV'deki paketi açmaz. Durum Bağlı olduğunda o oturumun `/tv` sayfası sunucuya yanıt veriyordur.

Eski isteğe bağlı APK→Next köprüsü korunur: derlerken `EV_REMOTE_URL=http://<bilgisayar>:3000` veya başlatırken `ev_remote_url` ekstra alanı verilirse APK `/api/kumanda` yolunu yoklar; adres yoksa yoklama başlamaz. Eski köprünün telefon adresi `/kumanda?legacy=1` olur. Native QR yolu bu köprüye ihtiyaç duymaz.

## Android derleme ve test

JDK 17+, Android SDK platform 35/build-tools 35.0.0 gerekir. Gradle 8.11.1 wrapper JAR ve dağıtım SHA-256 doğrulaması depodadır. SDK için `ANDROID_HOME`, gerekirse `android/local.properties` içindeki `sdk.dir` kullanılır; local.properties commit edilmez. Bu bulut ortamının doğrulanmış araç kurulumu için `assets/TOOLCHAIN.md` ve `scripts/setup-android-toolchain.py` kullanılabilir.

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
python3 scripts/prepare-assets.py --check
cd android
./gradlew :core:test :app:assembleDebug
bash scripts/test-phone-remote.sh
cp app/build/outputs/apk/debug/app-debug.apk evekrani-a850c-debug.apk
```

Çıktı `android/evekrani-a850c-debug.apk` dosyasıdır. minSdk 24, compileSdk 35, targetSdk 29; eski Downloads okuma akışı için legacy depolama korunur. `android/local.properties`, `public/a850c-ev-ekrani.zip` ve `public/CODEX-GOREV.txt` Git dışında tutulur. Gerçek TV kurulumu ve üreticiye özgü varsayılan HOME seçimi ayrıca cihaz üzerinde doğrulanmalıdır.

## REA

**Dosya ve REA → REA**, kullanıcı tarafından sağlanan APK'yı `rea inspect-android-package` ile inceler; APK çalıştırılmaz. `app/api/rea/inspect`, `lib/rea.ts`, `components/rea-panel.tsx` korunur. Komut yolu `REA_BIN` ile değiştirilebilir; varsayılan `~/.local/bin/rea`. Sınıf gövdeleri için kullanıcı tarafından sağlanan JADX JAR gerekir. REA/JADX temel tasarımcı, native launcher veya QR kumandası için zorunlu değildir.
