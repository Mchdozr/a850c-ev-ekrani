# A 850 C ev ekranı

Arçelik 8 serisi **A 850 C** Google TV (50 inç, 4K UHD QLED, Dolby Vision ve Atmos) için kendi giriş ekranınız. Karşılama, profil adı, hava satırı, İstanbul saati, duvar kâğıdı, uygulama şeridi ve içerik sıraları sizin metninizdir. Paket adı `dev.evekrani.a850c`, uygulama adı **Ev ekranı**dır. Arçelik adına imzalanmış bir sistem uygulaması değildir.

Bu depo Google’ın başlatıcısını (`com.google.android.apps.tv.launcherx` veya `com.google.android.tvlauncher`) değiştirmez, imzasını bozmaz ve sistem bölümüne yazmaz. Cihaz prize takılırken görünen Arçelik veya Google logosu televizyonun kendi yazılımıdır. Tasarım, Android açılışı bittikten sonra, bu uygulamayı varsayılan Ana Sayfa olarak seçtiğinizde gelir.

## Televizyona kurma

Hata ayıklama paketi: `android/evekrani-a850c-debug.apk`

1. Televizyonda geliştirici seçeneklerini açın. Ayarlar > Sistem > Hakkında bölümünde Android TV işletim sistemi derlemesine art arda basın. Sonra USB hata ayıklamayı veya kablosuz hata ayıklamayı açın.
2. Bilgisayardan kurun. USB bağlıysa:

```bash
adb devices
adb install -r android/evekrani-a850c-debug.apk
```

Kablosuz hata ayıklamada televizyonun gösterdiği eşleştirme kodu ve adres kullanılır:

```bash
adb pair <televizyon-adresi>:<eşleştirme-portu>
adb connect <televizyon-adresi>:<bağlantı-portu>
adb install -r android/evekrani-a850c-debug.apk
```

3. Kumandada Ana Sayfa’ya basın ve **Ev ekranı** uygulamasını varsayılan olarak seçin. Liste açılmazsa Ayarlar > Uygulamalar > Varsayılan uygulamalar > Ana sayfa yolunu kullanın. Google TV ana sayfası zaten varsayılansa, o uygulamanın varsayılan açılışını temizleyip Ana Sayfa’ya yeniden basın.
4. Bundan sonra Ana Sayfa bu tasarımı açar. Üretici logosu açılışta yine televizyonun kendi logosudur.

Ağ olmadan ekran, tasarımcıdaki `createDefaultDesign()` ile aynı mozaiktir: sonbahar bahçesi, sol üstte İstanbul saati ve büyük uygulama karoları. YouTube kırmızı karoda beyaz oynat üçgeni, Netflix koyu karoda beyaz N olarak çizilir. Sağdaki **Kendin yap** paneli tasarım, arka plan, karo, etiket, logo rengi, yazı tipi ve saati hemen değiştirir. Disney+, BluTV, tabii ve Ayarlar da kendi işaretlerini taşır. YouTube (`com.google.android.youtube.tv`, yoksa `com.google.android.youtube`) veya Netflix (`com.netflix.ninja`, yoksa `com.netflix.mediaclient`) kuruluysa kutuda o paketin kendi simgesi durur. Tamam veya Enter, kuruluysa leanback ya da açılış niyetiyle uygulamayı başlatır. Paket yoksa çizilmiş işaret kalır ve ekran kapanmaz. Diğer kutular seçilen adı gösterir.

Tasarımcının indirdiği dosyayı kullanmak isteğe bağlıdır:

```bash
adb push a850c-ev-ekrani.json /sdcard/Download/a850c-ev-ekrani.json
adb shell pm grant dev.evekrani.a850c android.permission.READ_EXTERNAL_STORAGE
```

Dosya yoksa veya televizyon okumayı engellerse yerleşik mozaik kalır. Dosya bozuksa ekran örneğe döner ve altta kısa bir uyarı gösterir. Ana Sayfa’ya tekrar basınca dosya yeniden okunur. İzin yeni verildiyse bir kez `adb shell am force-stop dev.evekrani.a850c` deyip Ana Sayfa’ya basın.

## Tasarımcı

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın. Tam ekran görünüm [http://localhost:3000/tv](http://localhost:3000/tv) yolundadır. Bu adres Ana Sayfa düğmesinin yerine geçmez.

Ağdaki televizyon tarayıcısından bakmak için:

```bash
npx next dev --hostname 0.0.0.0 --port 43123
```

Televizyona `http://<bilgisayarın-adresi>:43123/tv` yazın. Telefon kumandası aynı sunucuda `http://<bilgisayarın-adresi>:43123/kumanda` adresindedir. Bu makinede geliştirme adresi `http://127.0.0.1:43123/kumanda` olur.

Ok tuşları ve telefon kumandası aynı odağı gezdirir. Yukarı, aşağı, sol, sağ ve Tamam `/tv` sayfasındaki ışıltıyı oynatır. YouTube ve Netflix kısayolları odağı o kutuya alır. Tamam, odaklanan kartı veya uygulamayı bir onayla gösterir. Onay önizlemedir; tarayıcı televizyondaki paketi açmaz. Tam ekranda Esc sizi tasarımcıya geri götürür.

Kumanda ile televizyon sayfası `localStorage` paylaşmaz. Son komut ve güncel odak bu Next sürecinin belleğindedir; sunucu yeniden başlayınca sıfırlanır. Telefon durumu “Bağlı” derken `/tv` kısa aralıklarla yoklamış demektir. Komut sunucuya gitmezse kumanda tek satırda hatayı söyler.

Bu bilgisayar Arçelik televizyonuna uzaktan basamaz. Kurulan APK, televizyon kumandasının oklarını kullanır. `EV_REMOTE_URL` derleme sırasında (`http://192.168.1.20:43123` gibi) ya da açılış ekstra alanı `ev_remote_url` ile verilirse uygulama aynı `/api/kumanda` yolunu yoklar. Adres yoksa yoklama başlamaz.

Tasarım bu tarayıcının `localStorage` alanına, `a850c-ev-ekrani-v3` anahtarıyla yazılır. Dosya sekmesinden JSON olarak dışa aktarabilir, geçerli bir dosyayı geri yükleyebilirsiniz. Bozuk JSON ekranı değiştirmez ve hatayı söyler.

## Android projesi

Kaynak `android/` altındadır. Kotlin, minSdk 24, hedef SDK 29’dur. Hedef, `/sdcard/Download/a850c-ev-ekrani.json` yolunun sideload bir ana ekranda okunabilmesi için legacy depolamada tutulur. Derlemek için JDK 17+ ve Android SDK (compileSdk 35) gerekir:

```bash
cd android
./gradlew :core:test :app:assembleDebug
```

Çıktı `android/app/build/outputs/apk/debug/app-debug.apk` olur. Depodaki kopya `android/evekrani-a850c-debug.apk` dosyasıdır.

## REA

REA sekmesi, verdiğiniz bir APK’yı `rea inspect-android-package` ile okur. Paket çalıştırılmaz. Komut yolu `REA_BIN` ile değişir; varsayılan `~/.local/bin/rea` olur. Sınıf gövdesi için ayrıca sizin sağladığınız JADX JAR gerekir. Bu kurulum JADX veya ADB indirmez. Televizyon bu bilgisayara bağlı değilse ekranı buradan çekilmez.
