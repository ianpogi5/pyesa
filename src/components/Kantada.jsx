import { useState } from "react";
import "./Kantada.css";

const Kantada = () => {
  const [fontSize, setFontSize] = useState(16);

  // Increase font size (limit to 32px)
  const increaseFontSize = () => {
    setFontSize((prevFontSize) => Math.min(prevFontSize + 2, 32));
  };

  // Decrease font size (limit to 12px)
  const decreaseFontSize = () => {
    setFontSize((prevFontSize) => Math.max(prevFontSize - 2, 12));
  };

  return (
    <div className="kantada">
      <h3>Panalangin Para Sa Kaluluwa </h3>
      <b>(Rosario Cantada) </b>
      <div className="content-controls">
        <button onClick={decreaseFontSize} disabled={fontSize <= 12}>
          A-
        </button>
        <span>Font Size: {fontSize}px</span>
        <button onClick={increaseFontSize} disabled={fontSize >= 32}>
          A+
        </button>
      </div>
      <div style={{ fontSize: `${fontSize}px` }}>
        <p>
          <b className="leader">NAMUMUNO:</b> Sa Ngalan ng Ama, at ng Anak, at
          ng Espiritu Santo. Amen.
        </p>
        <p>
          Panginoon kong Hesukristo, Diyos na totoo at tao namang totoo, gumawa
          at sumakop sa akin. Pinagsisisihan kong masakit sa tanang loob ko ang
          lahat ng pagkakasala ko sa iyo, na Ikaw nga ang Diyos ko, Panginoon ko
          at Ama ko na iniibig ko nang higit sa lahat.
        </p>
        <p>
          Nagtitika akong matibay na matibay na di na muling magkakasala sa Iyo
          at magsisikap na magkumpisal ng lahat ng kasalanan ko. Umaasa akong
          patatawarin mo rin alang-alang sa Iyong mahal na Pasyon at pagkamatay
          Mo sa krus ng dahil sa akin. Siya Nawa.
        </p>
        <p>
          Tanggapin Mo ang aming pagsisisi bilang handog upang kami&#39;y
          matutong sumunod sa Iyo nang buong puso. Walang nagtiwala sa Iyo na
          nabigo, simula ngayon, buong puso kaming susunod sa Iyo sasamba at
          magpupuri sa Iyo. Huwag mo kaming biguin yamang Ikaw ay maamo at
          mapagkalinga. Kahabagan mo kami at saklolohan. Muli mong iparanas sa
          amin ang Iyong kahanga-hangang pagliligtas at sa gayo&#39;y muling
          dakilain ang iyong pangalan, Panginoon.
        </p>
        <p>
          Lubhang maawaing Hesus ko, lingapin mo ng mata mong maamo ang mga
          kaluluwa ng mga binyagang nangamatay na, at ang kaluluwa ni
          ______________ ng dahil sa amin at sa kanya ay nagpakasakit ka at
          namatay sa krus. Siya Nawa.
        </p>
        <p className="text-center">
          <b>(AWITIN ANG &#39;AMA NAMIN&#39;)</b>
        </p>
        <p>
          <b className="response">Tugon:</b> Kaawaan mo&#39;t patawarin ang
          kaluluwa ni ______________.
        </p>
        <p>
          <b className="leader">Namumuno:</b>
        </p>
        <p>
          (1) Hesus ko, alangang-alang sa masaganang dugo na iyong ipinawis ng
          manalangin ka sa halamanan.
        </p>
        <p>
          (2) Hesus ko, alang-alang sa tampal na tinanggap ng Iyong
          kagalang-galang na mukha.
        </p>
        <p>(3) Hesus ko, alang-alang sa masakit na hampas na iyong tiniis.</p>
        <p>
          (4) Hesus ko, alang-alang sa koronang tinik na tumimo sa
          kabanal-banalan mong ulo.
        </p>
        <p>
          (5) Hesus ko, alang-alang sa paglakad mo sa lansangan ng kapaitan na
          ang krus ay iyong pinapasan.
        </p>
        <p>
          (6) Hesus ko, alang-alang sa kabanal-banalang mukha mo na naliligo sa
          dugo at iyong binayaang malarawan sa birang ni Veronica.
        </p>
        <p>
          (7) Hesus ko alang-alang sa damit mong natigmak ng dugo na biglang
          pinunit at hinubad sa Iyong katawan ng mga tampalasan.
        </p>
        <p>
          (8) Hesus ko, alang-alang sa kabanal-banalan mong katawan na napako sa
          krus.
        </p>
        <p>
          (9) Hesus ko, alang-alang sa Iyong kamahal-mahalang mga paa at kamay
          na pinaglagusan ng mga pakong ipinagdalita mong masakit.
        </p>
        <p>
          (10) Hesus ko, alang-alang sa tagiliran mong nabuksan sa saksak ng
          isang matalim na sibat at ito ay binukalan ng dugo at tubig.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Pagkalooban mo siya Panginoon ng
          pagpapahingang walang hanggan.
        </p>
        <p>
          <b className="response">Tugon:</b> Liwanagan mo siya nang di magmaliw
          mong ilaw.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Mapanatag nawa siya sa Kapayapaan.
        </p>
        <p>
          <b className="response">Tugon:</b> Siya Nawa.
        </p>
        <p className="text-center">
          <b>“AVE MARIA” </b>
        </p>
        <p className="text-center">
          Sa Reyna ng langit, Ina ni Hesus. <br />
          Tayo na&#39;t mag-alay, magpuri ng lubos. <br />
          Ave, Ave, Ave Maria <br />
          Ave, Ave, Ave Maria
        </p>
        <p className="text-center">
          Maria Sinta ka ng puso, mahal kong Ina <br />
          Yaman ka&#39;t pag-asa, ni&#39;ring kaluluwa. <br />
          Ave, Ave, Ave Maria <br />
          Ave, Ave, Ave Maria
        </p>
        <p className="text-center">
          Malalim na dagat ang sanlibutan. <br />
          Kami ay ingatan sa paglalayag. <br />
          Ave, Ave, Ave Maria <br />
          Ave, Ave, Ave Maria
        </p>
        <p className="text-center">
          Pinto ka ng langit, bahay nag into. <br />
          Kami&#39;y may pag-asang pumiling sa iyo. <br />
          Ave, Ave, Ave Maria <br />
          Ave, Ave, Ave Maria
        </p>
        <p className="text-center">
          Birheng maligaya, luklukan ng mahal. <br />
          Kami&#39;y patnubayan sa kalangitan. <br />
          Ave, Ave, Ave Maria <br />
          Ave, Ave, Ave Maria
        </p>
        <p>
          <b className="leader">Namumuno:</b> Katamis-tamisang Hesus, sa
          pagsakop Mo sa sangkatauhan, inibig mong magkatawang tao sa
          sinapupunan ng Mahal na Birhen. Unang tumulo ang Iyong banal na dugo
          nang Ikaw ay binyagan sa templo ng Herusalem.
        </p>
        <p>
          Nang sumapit ang takdang panahon ikaw ay nangaral, nagpakita ng
          magandang halimbawa ng pag- ibig, nagpagaling sa mga maysakit,
          nagpabangon ka ng mga patay, at Iyong itinuwid ang mga maling aral sa
          templo, sa pagtutuwid mong ito, ikaw ay kanilang kinapootan,
          inalipusta ng mga hudyo, ikaw ay napasakamay nila dahil sa pagtataksil
          at paghalik ni Hudas, ginapos ka ng lubid at nilapastangan sa harap
          nila Anas, Pilato, Herodes at Kaypas.
        </p>
        <p>
          Sa harap nitong mga Hukom ikaw ay niluran, sinaktan, sinampal,
          inalimura, tinadtad ng sugat ang iyong banal na katawan sa hampas ng
          suplina, pinutungan ng koronang tinik at tinakpan ang iyong mukha ng
          isang purpura, bilang pagpapalibhasa ng mga kaaway, nang sila ay
          nagsawa na ng ganitong mga parusa, ikaw ay dinala sa bundok ng Golgota
          tulad ng isang korderong walang sala.
        </p>
        <p>
          Pagkatapos mong pasanin ang mabigat na krus, ikaw ay ibinayubay at
          ipanagitna sa dalawang magnanakaw, upang palabasin na isa sa kanila.
          Nang ikaw ay mauhaw dahil sa tindi ng sugat sa katawan, ikaw ay
          pinainom, ngunit ang ibinigay sa Iyo ay suka na may kahalong apdo.
          Pagkaraan ng mahabang pagdurusa sa ibabaw ng krus, ikaw ay namatay.
        </p>
        <p>
          At upang matiyak na Ikaw ay isa nang bangkay, inulos ni Longlino ang
          Iyong tagiliran at doon ay bumukal ang masaganang dugo at tubig, na
          panghugas sa kasalanan ng sangkatauhan.
        </p>
        <p>
          Nang dahil sa Iyong mga hirap, kamatayan at pagkabuhay na mag-uli,
          iligtas mo po ang kaluluwa ni _________________ na namatay.
        </p>
        <p>
          Papaging dapatin mo po siya sa Iyong walang hanggang kaharian at
          ibilang sa pulutong ng mga banal, Ikaw na nabubuhay at naghahari ng
          kasama ng Ama at ng Espiritu Santo sa lahat ng panahon. Siya Nawa.
        </p>
        <p className="text-center">
          <b>(AWIT)</b>
        </p>
        <p>
          <b className="leader">Namumuno:</b> Maganda kang tunay O Mariang
          walang kadungis-dungis.
        </p>
        <p>(Magkukrus ng 3 ulit)</p>
        <ul>
          <li>
            Aba anak ng Diyos Ama, Aba Ina ng Diyos Anak, Aba Esposa ng Espiritu
            Santo
          </li>
          <li>Aba Simbahang mahal ng Santisima Trinidad</li>
          <li>
            Aba Inang kalinis-linisan na ipinaglihi na di nagmana ng salang
            orihinal.
          </li>
        </ul>
        <p>
          <b className="response">Lahat:</b> Sumasampalataya ako sa Diyos Amang
          Makapangyarihan sa lahat, na Maylikha ng langit at lupa.
          Sumasampalataya ako kay Jesukristo, iisang Anak ng Diyos, Panginoon
          nating lahat. Nagkatawang-tao siya lalang ng Espiritu Santo,
          ipinanganak ni Santa Mariang Birhen. Pinagpakasakit ni Poncio Pilato,
          ipinako sa krus, namatay, inilibing. Nanaog sa kinaroroonan ng mga
          yumao; nang ikatlong araw nabuhay na mag-uli. Umakyat sa langit,
          naluluklok sa kanan ng Diyos Amang Makapangyarihan sa lahat; at doon
          magmumulang paririto&#39;t maghuhukom sa nangabubuhay at nangamatay na
          tao. Sumasampalataya ako sa Espiritu Santo, sa Banal na Simbahang
          Katolika, sa kasamahan ng mga Banal; sa kapatawaran ng mga kasa-lanan,
          sa pagkabuhay na mag-uli ng nangamatay na tao, at sa buhay na walang
          hanggan. Amen.
        </p>
        <p className="text-center">
          <b>(AWIT)</b>
        </p>
        <p>
          <b className="leader">Namumuno:</b> Panginoon, maawa Ka sa kanya
          <br />
          <b className="response">Tugon:</b> Panginoon, maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kristo, maawa Ka sa kanya
          <br />
          <b className="response">Tugon:</b> Kristo, maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Panginoon, maawa Ka sa kanya
          <br />
          <b className="response">Tugon:</b> Panginoon, maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kristo, pakinggan mo siya
          <br />
          <b className="response">Tugon:</b> Kristo, pakinggan mo siya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kristo, pakapakinggan mo siya
          <br />
          <b className="response">Tugon:</b> Kristo, pakapakinggan mo siya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Diyos Ama sa langit
          <br />
          <b className="response">Tugon:</b>Maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Diyos Anak na tumubos sa
          sanlibutan
          <br />
          <b className="response">Tugon:</b>Maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Diyos Espiritu Santo
          <br />
          <b className="response">Tugon:</b> Maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Santisima Trinidad tatlong persona
          sa Iisang Diyos
          <br />
          <b className="response">Tugon:</b> Maawa Ka sa kanya
        </p>
        <p>
          <b className="leader">Namumuno:</b> Santa Maria
          <br />
          <b className="response">Tugon:</b> *Ipanalangin mo siya
        </p>
        <p>
          <b className="leader">Namumuno:</b>
          <br />
          Santang Ina ng Diyos* <br />
          Santang Birhen ng mga birhen* <br />
          Ina ni Kristo* <br />
          Ina ng grasya ng Diyos* <br />
          Inang kasakdal-sakdalan* <br />
          Inang walang malay sa kahalayan* <br />
          Inang di malapitan ng masama* <br />
          Inang walang bahid ng kasalanan* <br />
          Inang kalinis-linisan* <br />
          Inang kaibig-ibig* <br />
          Inang kataka-taka* <br />
          Ina ng mabuting kahatulan* <br />
          Ina ng May Gawa ng Lahat* <br />
          Ina na magpag-adya* <br />
          Birheng kapaham-pahaman* <br />
          Birheng dapat igalang* <br />
          Birheng dapat ipagbantog* <br />
          Birheng makapangyayari* <br />
          Birheng maawain* <br />
          Birheng matibay ang loob sa magaling* <br />
          Salamin ng katuwiran* <br />
          Luklukan ng karunungan* <br />
          Simula ng tuwa namin* <br />
          Sisidlan ng kabanalan* <br />
          Sisidlan ng bunyi at bantog* <br />
          Sisdlang bukod na kusang loob na masunurin sa Panginoong Diyos* <br />
          Rosang bulaklak na di mapuspos ng bait ng tao ang halaga* <br />
          Tore ni David* <br />
          Toreng garing* <br />
          Bahay na ginto* <br />
          Kaban ng tipan* <br />
          Pinto ng langit* <br />
          Talang maliwanag* <br />
          Mapagpagaling sa mga maysakit* <br />
          Sakdalan ng mga makasalanan* <br />
          Mapang-aliw sa mga nagdadalamhati* <br />
          Mapag-ampon sa mga Kristiyano* <br />
          Reyna ng mga anghel* <br />
          Reyna ng mga propeta* <br />
          Reyna ng mga apostol* <br />
          Reyna ng mga martir* <br />
          Reyna ng mga kompesor* <br />
          Reyna ng mga birhen* <br />
          Reyna ng lahat ng mga santo* <br />
          Reynang ipininaglihi ng walang salang orihinal* <br />
          Reynang iniakyat sa langit* <br />
          Reyna ng kasantu-santusang rosaryo* <br />
          Reyna ng kapayapaan* <br />
          Reyna ng mga pamilya* <br />
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kordero ng Diyos na nakawawala ng
          mga kasalanan ng sanlibutan. <br />
          <b className="response">Tugon:</b> Patawarin mo po siya Panginoon.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kordero ng Diyos na nakawawala ng
          mga kasalanan ng sandaigdigan. <br />
          <b className="response">Tugon:</b> Pakapakinggan mo po siya Panginoon.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kordero ng Diyos na nakawawala ng
          mga kasalanan ng santinakpan. <br />
          <b className="response">Tugon:</b> Kaawan mo po siya Panginoon.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Ipinanalangin namin siya
          Panginoon. <br />
          <b className="response">Tugon:</b> Nang siya ay maging dapat
          makinabang sa mga pangako ni Hesukristong Panginoon.
        </p>
        <p className="text-center">
          <b>(AWIT)</b>
        </p>
        <p>
          <b className="leader">Namumuno:</b> Hesus, Maria, Jose, Hesus na
          kahanga-hanga, Mariang Ina ng Awa, Jose na mapagpala, kayo na po ang
          mag-ampon at kumalinga sa alipin ninyong aba ng hindi mapasama sa
          impyerno.
        </p>
        <p>
          <b className="leader">Namumuno:</b> <br />
          Ama namin, sumasalangit Ka. <br />
          Sambahin ang ngalan mo. <br />
          Mapasaamin ang kaharian mo <br />
          Sundin ang loob mo dito sa lupa para nang sa langit.
        </p>
        <p>
          <b className="response">Lahat:</b> <br />
          Bigyan mo po kami ngayon ng aming kakainin sa araw-araw <br />
          At patawarin Mo po kami sa aming mga sala <br />
          Para nang pagpapatawad namin sa mga nagkakasala sa amin. <br />
          At huwag mo po kaming ipahintulot sa tukso <br />
          At iadya mo kami sa lahat ng masama <br />
          Amen
        </p>
        <p>
          <b className="leader">Namumuno:</b> <br />
          Aba Ginoong Maria, napupuno ka ng grasya, <br />
          Ang Panginoong Diyos ay sumasaiyo. <br />
          Bukod kang pinagpala sa babaeng lahat <br />
          At pinagpala naman ang &#39;yong anak na si Hesus.
        </p>
        <p>
          <b className="response">Lahat:</b> <br />
          Santa Maria, Ina ng Diyos <br />
          Ipanalangin mo kaming makasalanan <br />
          Ngayon at kung kami&#39;y mamamatay. <br />
          Amen
        </p>
        <p>
          <b className="leader">Namumuno:</b> Pagkalooban mo po siya Panginoon
          ng pagpapahingang walang hanggan. <br />
          <b className="response">Tugon:</b> At liwanagan mo po siya Panginoon
          ng di magmaliw mong ilaw.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Mapanatag nawa siya sa kapayapaan.{" "}
          <br />
          <b className="response">Tugon:</b> Siya Nawa.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Inihahabilin namin sa Iyo, o
          Panginoon ang kaluluwa ni ____________ na sa pagpanaw niya dito sa
          lupa, iyo pong ipatawad ang kanyang buhay at alang-alang sa Iyong
          habag, loobin Mong manatili siya sa Iyong banal na kaharian. Siya
          Nawa.
        </p>
        <p>
          O Panginoon naming Hesus, alang-alang sa Iyong kahirapan, kaawaan Mo
          ang kaluluwa ni ________________ at ang mga kaluluwa sa Purgatoryo.
        </p>
        <p>
          <b className="leader">Namumuno:</b> <br />
          Ama namin, sumasalangit Ka. Sambahin ang ngalan mo. Mapasaamin ang
          kaharian mo. Sundin ang loob mo dito sa lupa para nang sa langit.
        </p>
        <p>
          <b className="response">Lahat:</b> Bigyan mo po kami ngayon ng aming
          kakainin sa araw-araw. At patawarin Mo po kami sa aming mga sala Para
          nang pagpapatawad namin sa mga nagkakasala sa amin. At huwag mo po
          kaming ipahintulot sa tukso. At iadya mo kami sa lahat ng masama. Amen
        </p>
        <p>
          <b className="leader">Namumuno:</b> Aba Ginoong Maria…
        </p>
        <p>
          <b className="response">Lahat:</b> Santa Maria, Ina ng Diyos…
        </p>
        <p>
          <b className="leader">Namumuno:</b> Para sa Maybahay at sa Lahat ng
          Narito
        </p>
        <p>
          <b className="leader">Namumuno:</b> <br />
          Ama namin, sumasalangit Ka. Sambahin ang ngalan mo. <br />
          Mapasaamin ang kaharian mo. Sundin ang loob mo dito sa lupa para nang
          sa langit.
        </p>
        <p>
          <b className="response">Lahat:</b> Bigyan mo po kami ngayon ng aming
          kakainin sa araw-araw. At patawarin Mo po kami sa aming mga sala Para
          nang pagpapatawad namin sa mga nagkakasala sa amin. At huwag mo po
          kaming ipahintulot sa tukso. At iadya mo kami sa lahat ng masama. Amen
        </p>
        <p>
          <b className="leader">Namumuno:</b> Aba Ginoong Maria…
        </p>
        <p>
          <b className="response">Lahat:</b> Santa Maria, Ina ng Diyos…
        </p>
        <p className="text-center">
          <b>(AWIT)</b>
        </p>
        <p>
          <b className="leader">Namumuno:</b> Mahal na Birhen ito pong aming
          hain, di man dapat ay tanggapin, ang kaluluwa namin, kaawaan at
          ampunin, sa kamatayang darating, sa wakas ng buhay namin, sa langit mo
          po pagpalain. Siya Nawa.
        </p>
        <p>
          Pagpalain mo po kami&#39;t ampunin Diyos na Panginoon namin, igawad mo
          po sa amin ang Iyong tulong, pagpalain ang aming bahay at kaming lahat
          na namamahay. Iligtas mo kami sa lakas ng lindol, sa karahasan ng
          lintik, sa sunog, sa tubig, sa hangin at sa lahat ng makakasama sa
          amin, alang-alang na po sa katamis-tamisan ngalan ng anak mong si
          Hesus. Siya Nawa.
        </p>
        <p>
          Salamat po sa Iyo Panginon naming Diyos, kami&#39;y sinapit mo sa
          mahal na hapon, sapiting muli sa mahal mong umaga, bigyan ng buhay,
          lakas, kababaang-loob, pagtitiis, matutong umibig at maglingkod sa
          Iyo, Panginoon naming Diyos. Siya Nawa.
        </p>
        <p>
          <b className="response">Lahat:</b> Aba Po Santa Mariang Reyna, Ina ng
          awa, ikaw ang kabuhayan at katamisan; aba pinananaligan ka namin. Ikaw
          ang tinatawag namin, pinapanaw na anak ni Eva. Ikaw rin ang
          pinagbubuntuhang-hininga namin sa aming pagtangis dini sa lupang
          bayang kahapis-hapis. Ay aba pintakasi ka namin, ilingon mo sa amin
          ang mga mata mong maawain, at saka kung matapos yaring pagpanaw sa
          amin, ipakita mo sa amin ang iyong anak na si Jesus. Santa Maria Ina
          ng Diyos maawain at maalam at matamis na Birhen.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Ipanalangin mo kami Santang Ina ng
          Diyos. <br />
          <b className="response">Tugon:</b> Nang kami ay maging dapat
          makinabang sa mga Pangako ni Kristong Panginoon. Siya Nawa.
        </p>
        <p className="text-center">
          <b>(AWIT) </b>
        </p>
        <p>
          <b className="leader">Namumuno:</b> Ang Pagpapala ng Ama at ng Anak at
          ng Espiritu Santo, at ng Mahal na Birheng Maria, igawad mo sa amin at
          amin nawang tamuhin.
          <br />
          <b className="response">Tugon:</b> Siya Nawa.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kamahal-mahalang puso ni Hesus.{" "}
          <br />
          <b className="response">Tugon:</b> Maawa ka sa amin.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kalinis-linisang puso ni Maria.{" "}
          <br />
          <b className="response">Tugon:</b> Ipanalangin mo kami.
        </p>
        <p>
          <b className="leader">Namumuno:</b> San Juan <br />
          <b className="response">Tugon:</b> Ipanalangin mo kami.
        </p>
        <p>
          <b className="leader">Namumuno:</b> San Jose <br />
          <b className="response">Tugon:</b> Ipanalangin mo kami.
        </p>
        <p>
          <b className="leader">Namumuno:</b> San Lorenzo Ruiz at mga kasama{" "}
          <br />
          <b className="response">Tugon:</b> Ipanalangin ninyo kami.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Mga anghel at arkanghel ng Diyos.{" "}
          <br />
          <b className="response">Tugon:</b> Tulungan ninyo kami.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Hesus Hari ng Awa! <br />
          <b className="response">Tugon:</b> Kami ay nananalig sa iyo.
        </p>
        <p>
          <b className="leader">Namumuno:</b> O krus ni Kristong
          kabanal-banalan. <br />
          <b className="response">Tugon:</b> Iligtas mo kami sa lahat ng
          kasamaan.
        </p>
        <p>
          <b className="leader">Namumuno:</b> Kalinis-linisang puso ni Maria.{" "}
          <br />
          <b className="response">Tugon:</b> Ipanalangin mo kami ngayon at sa
          oras ng aming kamatayan.
        </p>
        <p>
          <b className="leader">Namumuno:</b> San Pedro Calungsod. <br />
          <b className="response">Tugon:</b> Ipanalangin mo kami.
        </p>
        <p className="text-center">
          <i>
            <b>Sa ngalan ng Ama, ng Anak at ng Espiritu Santo. Amen </b>
          </i>
        </p>
      </div>
    </div>
  );
};

export default Kantada;
