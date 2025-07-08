### Elkészítés célja
A cél egy olyan alkalmazás létrehozása volt, amely egyszerűbbé és gyorsabbá teszi az animátoroknak az eseményekre történő jelentkezést, valamint megkönnyíti az animátorkoordinátorok számára a jelentkezett önkéntesek kezelését. A megvalósításhoz a Node.js-ben elérhető könyvtárakat használtam, köztük az Angular és az Express keretrendszereket. Ezek választását az indokolta, hogy jelenleg is ezekkel a technológiákkal dolgozom a munkám során, így a fejlesztés során szerzett tapasztalatok közvetlenül hozzájárultak a meglévő tudásom bővítéséhez.

### Alkalmazás rövid ismertetése felhasználói szemszögből
Az alkalmazás alapvetően egy időpontfoglaló webes applikáció, amely lehetővé teszi az animátorok és koordinátorok számára az események hatékony kezelését. Az animátorok bejelentkezés után jelentkezhetnek a még elérhető eseményekre, illetve legkésőbb 24 órával a kezdési időpont előtt le is mondhatják azokat. A felhasználók számára továbbá lehetőség nyílik a saját eseményeik Google Naptárba történő exportálására, amennyiben csatlakoztatták Google-fiókjukat az alkalmazáshoz.
Általános felhasználóként megtekinthetők és szerkeszthetők a saját profiladatok. Koordinátorok és adminisztrátorok számára elérhető az események részletes megtekintése, a regisztrált felhasználók listája, valamint új események létrehozása. Az adminisztrátorok ezen felül jogosultak események törlésére, illetve felhasználói jogosultságok módosítására is.

### Alkalmazás rövid ismertetése fejlesztői szemszögből
Az alkalmazás adatbázis része Firebase Realtime Database-ben tárolódik. Ez egy felhőben tárolt adatbázis. Az adatokat JSON formátumban tárolja, és valós időben szinkronizál minden csatlakozott klienssel.

Az alkalmazás backendje Node.js Express Frameworkével került elkészítésre. A végpontok külön szegmensekre lettek bontva funkcionalitás alapján: autentikáció (auth.routes.js), események (events.routes.js), felhasználókezelés (users.routes.js), Google Calendar (googleCalendar.routes.js). A végpontok hozzáférését szabályozó függvények a middlewarek között találhatóak.

Az alkalmazás frontend része a Node.js Angular könyvtárával készült.
