# TV’ye dönüş ve Canlı TV tasarımı

## Amaç

Ev ekranı, TV’de yüklü uygulamaların seçilip ana ekrana eklenmesini sağlamalı; kullanıcı tek kartla Canlı TV’ye geçebilmeli ve Ayarlar’dan orijinal Google TV ana ekranına güvenle dönebilmelidir.

## Karar

Canlı TV varsayılan bir ana ekran kartıdır. Android uygulama, önce cihazdaki yayın uygulamalarını bulup açmayı dener; yayın uygulaması bulunmazsa Android TV giriş ayarını açar. Bu, sabit bir üretici paket adına bağlı değildir.

"Google TV’ye dön" yalnızca Ayarlar’da olur ve sistemde bulunan orijinal HOME etkinliğini açıkça başlatır. "Varsayılan ana sayfayı değiştir" Android’in HOME ayarını açar; kullanıcı orijinal launcher’ı seçebilir. Sistem paketleri, firmware, boot logosu ve imza kontrolleri değişmez.

## Uygulama kataloğu

Android TV’de Leanback/Launcher etkinliği olan üçüncü taraf uygulamalar taranır. Kullanıcı Ayarlar’daki Uygulamalar satırlarında seçtiklerini ana ekrana ekler ya da kaldırır. Seçilen uygulama paketi tasarımda saklanır; açılırken doğrudan bu paket başlatılır ve kendi simgesi kullanılır. Tarayıcı tasarımcısı, taşınabilir JSON için paket alanını korur; cihazdaki uygulamaları yalnız Android tarafı keşfedebilir.

## Sınırlar

TV yayınına ait uygulama veya giriş, TV üreticisinin Android kurulumuna bağlıdır. Uygulama yayın sinyalini kendisi çözmez. Orijinal launcher cihazda mevcut değilse geri dönüş satırı kullanıcıya açıklayıcı durum gösterir.
